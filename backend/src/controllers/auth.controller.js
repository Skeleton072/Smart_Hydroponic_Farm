const { registerUser, verifyUser, completeRegistration } = require("../services/auth.service");
const { validatePassword, validateEmail } = require("../utils/validate");
const redisClient = require("../config/redis");
const argon2 = require("argon2");

async function signup(req, res) {
  try {
    console.log("Signing up user...");
    const { user_name, email, password } = req.body;
    console.log("password: ", password);

    if (!user_name || user_name.trim() === "" || !validatePassword(password) || !validateEmail(email)) {
      console.log("Invalid user credentials!");
      return res.status(400).json({ message: "Invalid user credentials!" });
    }

    await registerUser(user_name, email, password);

    console.log("Verification code sent successfully");
    return res.status(200).json({ message: "Verification code sent to email." });
  } catch (error) {
    console.log("Server Error: ", error.message);
    return res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email) || !validatePassword(password)) {
      console.log("Invalid user credentials!");
      return res.status(400).json({ message: "Invalid user credentials!" });
    }

    await verifyUser(email, password);

    return res.status(200).json({ message: "Successfully logged in." });
  } catch (error) {
    console.log("Server Error: ", error.message);
    return res.status(400).json({ message: error.message });
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    const redisKey = `verify:${email}`;

    const [rawData, ttl] = await Promise.all([
      redisClient.get(redisKey),
      redisClient.ttl(redisKey)
    ]);

    if (!rawData || ttl < 0) {
      console.log("Error: Verification session expired or not found.");
      return res.status(400).json({ message: "Verification session expired or not found." });
    }

    const data = JSON.parse(rawData);
    const isOtpMatch = await argon2.verify(data.otp_hash, otp);

    if (!isOtpMatch) {
      console.log("Wrong OTP!");
      data.attempts += 1;

      if (data.attempts >= 3) {
        await redisClient.del(redisKey);
        console.log("Error: Too many failed attempts. Verification session locked.");
        return res.status(400).json({ message: "Too many failed attempts. Verification session locked." });
      }

      await redisClient.set(redisKey, JSON.stringify(data), "EX", ttl);
      return res.status(400).json({ message: "Wrong OTP!" });
    }
    
    // Successfully verified OTP -> Persist user to Supabase
    const user_id = await completeRegistration(redisKey);

    return res.status(200).json({ message: "Account created successfully. Welcome!", user_id });
  } catch (error) {
    console.log("Server Error: ", error.message);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { signup, login, verifyOTP };