const { findByEmail, createAccount } = require("../models/auth.model");
const redisClient = require("../config/redis");
const argon2 = require("argon2");
const sendEmail = require("../utils/sendEmail");

async function registerUser(user_name, email, password) {
  console.log("Registering user...");
  const existingUser = await findByEmail(email);

  if (existingUser) {
    throw new Error("Email has already been registered");
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const html = `
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

  const passwordHashed = await argon2.hash(password);
  const otp_hash = await argon2.hash(otpCode);

  const verificationRecord = {
    email,
    user_name,
    password_hash: passwordHashed,
    otp_hash,
    attempts: 0
  };

  const redisKey = `verify:${email}`;
  await redisClient.set(redisKey, JSON.stringify(verificationRecord), "EX", 300);
  await sendEmail(email, "Email Verification", html);
}

async function verifyUser(email, password) {
  const user = await findByEmail(email);

  if (!user) {
    throw new Error("Email has not been registered.");
  }
  
  const isMatch = await argon2.verify(user.password, password);

  if (!isMatch) {
    throw new Error("Password doesn't match.");
  }

  return true;
}

async function completeRegistration(redisKey) {
  const rawData = await redisClient.get(redisKey);
  if (!rawData) throw new Error("Verification session expired or not found.");

  const data = JSON.parse(rawData);
  const user_id = await createAccount(data.user_name, data.email, data.password_hash);
  await redisClient.del(redisKey);

  return user_id;
}

module.exports = { registerUser, verifyUser, completeRegistration };