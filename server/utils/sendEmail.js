const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  // 1) Create a transporter
  // Using Gmail as an example - ensure less secure app access is ON or use App Passwords
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Activate in gmail "less secure app" option or use App Password if 2FA is enabled
    // For production, use a dedicated email service like SendGrid, Mailgun, AWS SES
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_FROM, // sender address
    to: options.to, // list of receivers (can be comma-separated string)
    subject: options.subject, // Subject line
    text: options.text, // plain text body
    html: options.html, // html body (optional)
    attachments: options.attachments, // array of attachment objects (optional)
                                      // e.g., [{ filename: 'ticket.pdf', path: '/path/to/ticket.pdf' }]
  };

  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Email could not be sent"); // Re-throw for the controller to handle
  }
};

module.exports = sendEmail;
