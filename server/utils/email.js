const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Missing SMTP environment variables. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587/25
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // SiteGround commonly requires TLS; if you run into self-signed or intermediary cert issues, you can enable the below:
    tls: {
      // ciphers: 'SSLv3',
      // rejectUnauthorized: false,
    },
  });

  return transporter;
}

async function sendMail({ to, subject, html, text, from, attachments }) {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return info;
}

module.exports = { sendMail };
