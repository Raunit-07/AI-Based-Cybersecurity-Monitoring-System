import nodemailer from "nodemailer";

// ================= MAIL TRANSPORT =================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= SEND EMAIL =================
export const sendEmailAlert = async (alert) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email config missing — skipping email alert");
      return;
    }

    await transporter.sendMail({
      from: `"ThreatOps" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 Security Alert (${alert.severity})`,
      text: `
Alert Detected:

IP: ${alert.ip}
Type: ${alert.type}
Severity: ${alert.severity}
Time: ${alert.timestamp}
      `,
    });

    console.log("📧 Email alert sent");
  } catch (error) {
    console.error("Email error:", error.message);
  }
};