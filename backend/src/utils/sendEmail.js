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

function returnHTML(otpCode) {
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
      <tr>
          <td style="padding: 40px 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                      <td style="text-align: center; padding-bottom: 30px;">
                          <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">Verification Code</h1>
                      </td>
                  </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <tr>
                      <td style="padding: 40px 30px;">
                          <p style="color: #6b7280; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                              Please use the following verification code to complete your request:
                          </p>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                              <tr>
                                  <td style="text-align: center;">
                                      <div style="background: #4f46e5; color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; border-radius: 6px; display: inline-block;">
                                          ${otpCode}
                                      </div>
                                  </td>
                              </tr>
                          </table>
                          <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0 0 24px 0; text-align: center;">
                              This code will expire in <strong style="color: #dc2626;">5 minutes</strong>
                          </p>
                      </td>
                  </tr>
              </table>
          </td>
      </tr>
    </table>
  `;
}

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

module.exports = { returnHTML, sendEmail };