import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/db.js';
import { createErrorResponse } from '../middlewares/errorHandler.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}
const SECRET_KEY = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7; // 1 week

// ─── Middleware: Strict Auth (requires valid token + verified email) ──────────
export const authenticateToken = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Authentication required.", requestId));
  }

  jwt.verify(token, SECRET_KEY, async (err, payload) => {
    if (err) {
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED';
      const msg = err.name === 'TokenExpiredError' ? 'Your session has expired. Please sign in again.' : 'Invalid authentication token.';
      return res.status(401).json(createErrorResponse(code, msg, requestId));
    }

    try {
      const user = await prisma.user.findUnique({ where: { email: payload.sub } });
      if (!user || !user.is_active) {
        return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Account not found or disabled.", requestId));
      }
      if (!user.email_verified) {
        return res.status(403).json(createErrorResponse("UNVERIFIED_ACCOUNT", "Please verify your email before accessing this resource.", requestId));
      }

      req.user = user;
      next();
    } catch (dbErr) {
      console.error("[authenticateToken] DB error:", dbErr.message);
      return res.status(503).json(createErrorResponse("SERVICE_UNAVAILABLE", "Service temporarily unavailable.", requestId));
    }
  });
};

// ─── Middleware: Optional Auth (for routes that work with or without login) ───
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) { next(); return; }

  jwt.verify(token, SECRET_KEY, async (err, payload) => {
    if (!err) {
      try {
        const user = await prisma.user.findUnique({ where: { email: payload.sub } });
        if (user && user.is_active && user.email_verified) req.user = user;
      } catch { /* ignore */ }
    }
    next();
  });
};

// ─── Middleware: Admin check ──────────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.status(403).json(createErrorResponse("FORBIDDEN", "Admin access required.", requestId));
  }
};

// ─── Helper: Generate and "Send" OTP ────────────────────────────────────────
async function generateAndSendOTP(email) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otp_hash = await bcrypt.hash(otp, 10);
  const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.emailVerification.upsert({
    where: { email },
    update: { otp_hash, expires_at, attempts: 0, last_resend_at: new Date() },
    create: { email, otp_hash, expires_at }
  });

  const result = await sendEmail({
    to: email,
    subject: 'Your Meesho Sakhi Verification Code',
    text: `Your verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#d63384;margin-bottom:8px">Meesho Sakhi 🛍️</h2>
        <p style="color:#374151">Your verification code is:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1f2937;padding:16px 0">${otp}</div>
        <p style="color:#6b7280;font-size:14px">This code expires in <strong>15 minutes</strong>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#9ca3af;font-size:12px">If you did not create a Meesho Sakhi account, you can safely ignore this email.</p>
      </div>
    `
  });

  if (!result.success) {
    throw new Error(`Email delivery failed: ${result.error}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /auth/register
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Email and password are required.", requestId));
    }
    if (password.length < 6) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Password must be at least 6 characters.", requestId));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Idempotent: if user already exists (verified or not), we still return
    // the same generic response to prevent email enumeration.
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!existingUser) {
      const hashed_password = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          hashed_password,
          email_verified: false
        }
      });
    } else if (existingUser.email_verified) {
      // User already exists and is verified — return generic success to prevent enumeration
      return res.json({
        error: null,
        message: "If this email isn't already registered, we've sent a verification code."
      });
    }
    // If user exists but is unverified, resend OTP (idempotent re-registration)

    try {
      await generateAndSendOTP(normalizedEmail);
    } catch (otpErr) {
      console.error("[register] OTP generation failed:", otpErr.message);
      // Don't leave account in a confusing state — return error
      return res.status(503).json(createErrorResponse("OTP_DELIVERY_FAILED", "Unable to send verification code. Please try again.", requestId));
    }

    // Generic success — never reveals whether the email was already taken
    res.json({
      error: null,
      message: "If this email isn't already registered, we've sent a verification code."
    });
  } catch (error) {
    console.error("[register] error:", error.message);
    // Catch Prisma unique constraint (P2002) as a safety net
    if (error.code === 'P2002') {
      return res.json({
        error: null,
        message: "If this email isn't already registered, we've sent a verification code."
      });
    }
    res.status(500).json(createErrorResponse("INTERNAL_ERROR", "Something went wrong. Please try again.", requestId));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /auth/verify-otp
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Email and verification code are required.", requestId));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await prisma.emailVerification.findUnique({ where: { email: normalizedEmail } });

    // No record = either never registered or already verified
    if (!record) {
      return res.status(400).json(createErrorResponse("INVALID_OTP", "Invalid or expired verification code.", requestId));
    }

    // Too many attempts
    if (record.attempts >= 5) {
      return res.status(400).json(createErrorResponse("OTP_ATTEMPTS_EXHAUSTED", "Too many failed attempts. Please request a new code.", requestId));
    }

    // Expired
    if (new Date() > record.expires_at) {
      return res.status(400).json(createErrorResponse("OTP_EXPIRED", "Verification code has expired. Please request a new one.", requestId));
    }

    // Compare
    const isValid = await bcrypt.compare(otp, record.otp_hash);
    if (!isValid) {
      await prisma.emailVerification.update({
        where: { email: normalizedEmail },
        data: { attempts: record.attempts + 1 }
      });
      const remaining = 4 - record.attempts;
      return res.status(400).json(createErrorResponse(
        "INVALID_OTP",
        remaining > 0 ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : "Too many failed attempts. Please request a new code.",
        requestId
      ));
    }

    // Mark email as verified
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { email_verified: true }
    });

    // Clean up the verification record (prevents OTP replay)
    await prisma.emailVerification.delete({ where: { email: normalizedEmail } });

    res.json({ error: null, message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    console.error("[verify-otp] error:", error.message);
    res.status(500).json(createErrorResponse("INTERNAL_ERROR", "Something went wrong during verification. Please try again.", requestId));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /auth/resend-otp
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/resend-otp', async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Email is required.", requestId));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await prisma.emailVerification.findUnique({ where: { email: normalizedEmail } });

    // Enforce 30-second cooldown
    if (record && (new Date() - record.last_resend_at < 30000)) {
      return res.status(429).json(createErrorResponse("RESEND_COOLDOWN", "Please wait before requesting another code.", requestId));
    }

    // Only send if the user exists and is not yet verified
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user && !user.email_verified) {
      try {
        await generateAndSendOTP(normalizedEmail);
      } catch (otpErr) {
        console.error("[resend-otp] OTP generation failed:", otpErr.message);
        return res.status(503).json(createErrorResponse("OTP_DELIVERY_FAILED", "Unable to send verification code. Please try again.", requestId));
      }
    }

    // Always return success to prevent email enumeration
    res.json({ error: null, message: "If your email is registered and unverified, a new code has been sent." });
  } catch (error) {
    console.error("[resend-otp] error:", error.message);
    res.status(500).json(createErrorResponse("INTERNAL_ERROR", "Something went wrong. Please try again.", requestId));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /auth/login
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  try {
    const emailInput = req.body.username || req.body.email;
    const password = req.body.password;
    if (!emailInput || !password) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Email and password are required.", requestId));
    }

    const normalizedEmail = emailInput.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Generic error for invalid credentials (prevents user enumeration)
    if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
      return res.status(401).json(createErrorResponse("INVALID_CREDENTIALS", "Incorrect email or password.", requestId));
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: {
          code: "EMAIL_UNVERIFIED",
          message: "Please verify your email address before signing in.",
          request_id: requestId
        }
      });
    }

    if (!user.is_active) {
      return res.status(403).json(createErrorResponse("ACCOUNT_DISABLED", "This account has been disabled.", requestId));
    }

    const token = jwt.sign({ sub: user.email }, SECRET_KEY, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
    res.json({ error: null, access_token: token, token_type: "bearer" });
  } catch (error) {
    console.error("[login] error:", error.message);
    res.status(500).json(createErrorResponse("INTERNAL_ERROR", "Something went wrong during login. Please try again.", requestId));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /auth/me
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/me', authenticateToken, async (req, res) => {
  const { hashed_password: _hp, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

export default router;
