import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM = "InterviewAce <barkbuddyinf@gmail.com>"
} = process.env

if (!SMTP_HOST) {
  console.warn("SMTP_HOST is not defined. Password reset emails will fail until SMTP credentials are configured.")
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
})

const buildOtpTemplate = (otp: string): { text: string; html: string } => {
  const text = `Use the following code to reset your InterviewAce password: ${otp}. This code expires in 15 minutes.`
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f6f8fb; padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 20px 60px rgba(15,23,42,0.08);">
        <tr><td style="text-align:center;">
          <h1 style="margin:0; font-size:24px; color:#0f172a;">Reset your password</h1>
          <p style="color:#475569; font-size:15px;">Use the one-time code below to reset your InterviewAce password. The code expires in 15 minutes.</p>
          <div style="display:inline-block; margin:24px 0; padding:16px 32px; font-size:32px; letter-spacing:8px; font-weight:700; color:#0f172a; background:#eef2ff; border-radius:12px;">
            ${otp}
          </div>
          <p style="color:#94a3b8; font-size:13px;">If you did not request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </div>
  `
  return { text, html }
}

export const sendPasswordResetOtpEmail = async (recipient: string, otp: string): Promise<void> => {
  if (!SMTP_HOST) {
    console.warn(`[mailer] SMTP not configured. OTP for ${recipient}: ${otp}`)
    return
  }

  const { text, html } = buildOtpTemplate(otp)

  await transporter.sendMail({
    from: MAIL_FROM,
    to: recipient,
    subject: "Your InterviewAce password reset code",
    text,
    html
  })
}
