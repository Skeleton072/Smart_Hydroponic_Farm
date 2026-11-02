const nodemailer = require('nodemailer');
const config = require('../config/config');
const { validateEmail } = require('../utils/validate');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: config.nodeMailer.emailUser,
    pass: config.nodeMailer.emailPass,
  },
});

async function sendEmail(receiverEmail, subject, html) {
  if (!validateEmail(config.nodeMailer.emailUser) || !validateEmail(receiverEmail)) {
    throw new Error('Invalid email address provided for sender or recipient.');
  }

  const mailOptions = {
    from: `"Smart Hydroponic Farm" <${config.nodeMailer.emailUser}>`,
    to: receiverEmail,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = sendEmail;