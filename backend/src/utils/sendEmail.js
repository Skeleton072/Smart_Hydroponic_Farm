const nodemailer = require('nodemailer');
const config = require('../config/config');
const { validateEmail } = require("../utils/validate");

async function sendEmail(receiverEmail, subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.nodeMailer.emailUser, // Your email address
      pass: config.nodeMailer.emailPass,          // Your email password or App Password
    },
  });

  if (!validateEmail(config.nodeMailer.emailUser) || !validateEmail(receiverEmail)) {
    console.log("Enter valid email!");
    return;
  }

  try {
    // 2. Define email options
    const mailOptions = {
      from: "Smart Hydroponic Farm", 
      to: receiverEmail,          
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendEmail;
