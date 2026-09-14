import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// ─── Shared API URL helper ──────────────────────────────────────────────────
function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
  return envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
}

// ─── Human-friendly error mapper ─────────────────────────────────────────────
function mapAuthError(status, errorObj) {
  const code = errorObj?.error?.code || errorObj?.code || '';
  const serverMsg = errorObj?.error?.message || errorObj?.message || errorObj?.detail || '';

  // Specific codes first
  if (code === 'EMAIL_UNVERIFIED') return { message: serverMsg || 'Please verify your email address.', trigger: 'otp' };
  if (code === 'OTP_EXPIRED') return { message: 'Your verification code has expired. Please request a new one.' };
  if (code === 'OTP_ATTEMPTS_EXHAUSTED') return { message: 'Too many failed attempts. Please request a new code.' };
  if (code === 'OTP_DELIVERY_FAILED') return { message: 'Unable to send verification code. Please try again shortly.' };
  if (code === 'RESEND_COOLDOWN') return { message: 'Please wait before requesting another code.' };
  if (code === 'INVALID_OTP') return { message: serverMsg || 'Invalid verification code.' };
  if (code === 'RATE_LIMITED') return { message: "You've made too many attempts. Please try again later." };
  if (code === 'ACCOUNT_DISABLED') return { message: 'This account has been disabled.' };

  // Status-based fallbacks
  if (status === 401) return { message: 'Incorrect email or password.' };
  if (status === 403) return { message: serverMsg || 'Access denied.' };
  if (status === 429) return { message: "You've made too many attempts. Please try again later." };
  if (status === 503) return { message: 'Service temporarily unavailable. Please try again shortly.' };
  if (status >= 500) return { message: 'Something went wrong on our side. Please try again.' };
  if (status === 0 || !status) return { message: 'Unable to connect. Check your internet connection and try again.' };

  return { message: serverMsg || 'An error occurred. Please try again.' };
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ─── Explicit state machines ──────────────────────────────────────────────
  // Each async operation has its OWN status: 'idle' | 'loading' | 'success' | 'error'
  const [loginStatus, setLoginStatus] = useState('idle');       // idle | loading | success | error
  const [registerStatus, setRegisterStatus] = useState('idle'); // idle | loading | success | error
  const [otpStatus, setOtpStatus] = useState('idle');           // idle | loading | success | error
  const [resendStatus, setResendStatus] = useState('idle');     // idle | loading | success | error

  // Messages — only ONE active at a time (error XOR success, never both)
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP Flow
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);

  // Idempotency: prevent double-submit
  const submittingRef = useRef(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // ─── Cooldown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ─── State transition helpers ─────────────────────────────────────────────
  // These ensure error and success are NEVER shown simultaneously.
  const setError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
  };
  const setSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
  };
  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // ─── OTP input handlers ───────────────────────────────────────────────────
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").slice(0, 6).split("");
    if (paste.every(char => !isNaN(char))) {
      const newOtp = [...otp];
      paste.forEach((char, index) => { newOtp[index] = char; });
      setOtp(newOtp);
    }
  };

  // ─── Mode toggle ──────────────────────────────────────────────────────────
  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearMessages();
    setShowOtp(false);
    setLoginStatus('idle');
    setRegisterStatus('idle');
    setOtpStatus('idle');
    setResendStatus('idle');
  };

  // Any loading state active?
  const isLoading = loginStatus === 'loading' || registerStatus === 'loading' || otpStatus === 'loading' || resendStatus === 'loading';

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const performLogin = async (loginEmail, loginPassword) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoginStatus('loading');
    clearMessages();

    try {
      const baseUrl = getBaseUrl();
      const body = new URLSearchParams({ username: loginEmail, password: loginPassword });
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const mapped = mapAuthError(res.status, errData);

        // Handle unverified email — transition to OTP screen
        if (mapped.trigger === 'otp') {
          setShowOtp(true);
          setCooldown(30);
          setError(mapped.message);
          setLoginStatus('error');
          submittingRef.current = false;
          return;
        }

        setError(mapped.message);
        setLoginStatus('error');
        submittingRef.current = false;
        return;
      }

      const data = await res.json();
      const tokenToSave = data.access_token;

      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${tokenToSave}` }
      });

      if (meRes.ok) {
        const userData = await meRes.json();
        login(tokenToSave, userData);
        setLoginStatus('success');
        navigate('/app');
      } else {
        setError('Failed to load user profile. Please try again.');
        setLoginStatus('error');
      }
    } catch (err) {
      setError(err.name === 'TypeError' ? 'Unable to connect. Check your internet connection and try again.' : 'Something went wrong. Please try again.');
      setLoginStatus('error');
    } finally {
      submittingRef.current = false;
    }
  };

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setRegisterStatus('loading');
    clearMessages();

    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const mapped = mapAuthError(res.status, errData);
        setError(mapped.message);
        setRegisterStatus('error');
        submittingRef.current = false;
        return;
      }

      // Registration submitted — transition to OTP screen
      // NOTE: We do NOT say "Registration successful" because the account is still pending.
      setShowOtp(true);
      setCooldown(30);
      setSuccess('A verification code has been sent to your email.');
      setRegisterStatus('success');
    } catch (err) {
      setError(err.name === 'TypeError' ? 'Unable to connect. Check your internet connection.' : 'Something went wrong. Please try again.');
      setRegisterStatus('error');
    } finally {
      submittingRef.current = false;
    }
  };

  // ─── RESEND OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async (targetEmail = email) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setResendStatus('loading');
    clearMessages();

    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const mapped = mapAuthError(res.status, errData);
        setError(mapped.message);
        setResendStatus('error');
        submittingRef.current = false;
        return;
      }

      setCooldown(30);
      setSuccess('A new verification code has been sent.');
      setResendStatus('success');
    } catch (err) {
      setError(err.name === 'TypeError' ? 'Unable to connect. Check your internet connection.' : 'Failed to resend code. Please try again.');
      setResendStatus('error');
    } finally {
      submittingRef.current = false;
    }
  };

  // ─── VERIFY OTP ───────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setOtpStatus('loading');
    clearMessages();

    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const mapped = mapAuthError(res.status, errData);
        setError(mapped.message);
        setOtpStatus('error');
        submittingRef.current = false;
        return;
      }

      // Verification success — transition to login screen
      setShowOtp(false);
      setIsLogin(true);
      setOtp(['', '', '', '', '', '']);
      setPassword('');
      setSuccess('Email verified successfully! Please sign in.');
      setOtpStatus('success');
    } catch (err) {
      setError(err.name === 'TypeError' ? 'Unable to connect. Check your internet connection.' : 'Verification failed. Please try again.');
      setOtpStatus('error');
    } finally {
      submittingRef.current = false;
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // OTP SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (showOtp) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', padding: 'clamp(14px, 4vw, 24px)' }}>
        <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(20px, 5vw, 32px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Verify your email</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              We've sent a code to <strong>{email}</strong>
            </p>
          </div>

          {errorMsg && (
            <div style={{ padding: '12px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px', border: '1px solid #fecaca' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px', border: '1px solid #a7f3d0' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleOtpSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '24px' }}>
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={e => handleOtpChange(e.target, index)}
                  onFocus={e => e.target.select()}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  disabled={isLoading}
                  style={{
                    width: 'clamp(34px, 11vw, 46px)', height: 'clamp(44px, 13vw, 56px)', fontSize: 'clamp(18px, 5vw, 24px)', textAlign: 'center',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)'
                  }}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', padding: '12px 0' }}>
              {otpStatus === 'loading' ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={() => handleResendOtp(email)}
              disabled={cooldown > 0 || isLoading}
              style={{ background: 'none', border: 'none', color: cooldown > 0 ? 'var(--text-tertiary)' : 'var(--brand-primary)', fontWeight: 600, cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
            >
              {resendStatus === 'loading' ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button onClick={() => { setShowOtp(false); clearMessages(); }} type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
              Change email / Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN / REGISTER SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', padding: 'clamp(14px, 4vw, 24px)' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(20px, 5vw, 32px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{isLogin ? 'Enter your details to sign in.' : 'Start your AI-powered shopping journey.'}</p>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px', border: '1px solid #fecaca' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px', border: '1px solid #a7f3d0' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={isLogin ? handleLoginSubmit : handleRegistrationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required={!isLogin}
                disabled={isLoading}
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              <span>Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '8px', width: '100%', padding: '12px 0' }}>
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Continue')}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={toggleMode}
            disabled={isLoading}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', outline: 'none' }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
