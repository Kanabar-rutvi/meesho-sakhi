import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function verifyEmailConnection() {
    try {
        await transporter.verify();
        console.log("✅ Gmail SMTP connection successful");
        return true;
    } catch (error) {
        console.error("❌ Gmail SMTP connection failed:");
        console.error(error);
        return false;
    }
}

export async function sendEmail({ to, subject, text, html }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html,
        });

        console.log("✅ Email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("❌ Email sending failed:");
        console.error(error);

        return {
            success: false,
            error: error.message,
        };
    }
}