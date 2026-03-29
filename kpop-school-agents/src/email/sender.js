import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function sendEmail({ from, to, subject, body, signature }) {
  const fullBody = signature ? `${body}\n\n${signature}` : body;

  const info = await transporter.sendMail({
    from: `${from} <${process.env.SMTP_USER}>`,
    to,
    subject,
    text: fullBody
  });

  return info;
}

export async function testSMTP() {
  try {
    await transporter.verify();
    console.log('✅ SMTP Aruba connesso');
    return true;
  } catch (err) {
    console.error('❌ SMTP errore:', err.message);
    return false;
  }
}
