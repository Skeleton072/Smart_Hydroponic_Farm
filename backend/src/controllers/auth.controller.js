const authService = require("../services/auth.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokenHandling");
const { validateEmail, validatePassword, validatePasswordForLogin, validateOtp, validateName } = require("../utils/validate");
const { serviceError, toHttpError, CODES } = require("../utils/errorHandling");
const crypto = require("crypto");
const redisClient = require("../config/redis");

function sendError(res, err, context) {
  const { status, body } = toHttpError(err);
  if (status >= 500) {
    console.error({ 
      context, 
      code: err?.code, 
      message: err?.message, 
      stack: err?.stack 
    });
  }

  return res.status(status).json(body);
}

async function issueSession(user_id) {
  const accessToken = await generateAccessToken({ user_id });
  const refreshToken = await generateRefreshToken({ user_id });
  return { accessToken, refreshToken };
}

// POST /auth/signup
async function signup(req, res) {
  try {
    const { user_name, email, password } = req.body ?? {};

    if (!validateName(user_name) || !validateEmail(email) || !validatePassword(password)) {
      throw serviceError(CODES.INVALID_INPUT);
    }

    await authService.startSignup(user_name.trim(), email, password);

    return res.status(200).json({ message: "If eligible, a verification code has been sent." });
  } catch (err) {
    return sendError(res, err, "signup");
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    console.log("email", email);

    if (!validateEmail(email) || !validatePasswordForLogin(password)) {
      throw serviceError(CODES.INVALID_CREDENTIALS);
    }

    const user_id = await authService.authenticate(email, password);
    const tokens = await issueSession(user_id);

    return res.status(200).json({ message: "Logged in.", ...tokens });
  } catch (err) {
    return sendError(res, err, "login");
  }
}

// POST /auth/verifyOTP
async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body ?? {};

    if (!validateEmail(email) || !validateOtp(otp)) {
      throw serviceError(CODES.INVALID_INPUT);
    }

    const user_id = await authService.verifyOtp(email.toLowerCase(), otp);
    const tokens = await issueSession(user_id);

    return res.status(200).json({ message: "Account created.", ...tokens });
  } catch (err) {
    return sendError(res, err, "verifyOTP");
  }
}

// POST /auth/resendOTP
async function resendOTP(req, res) {
  try {
    const { email } = req.body ?? {};

    if (!validateEmail(email)) throw serviceError(CODES.INVALID_INPUT);
    await authService.resendOtp(email);

    return res.status(200).json({ message: "Verification code resent." });
  } catch (err) {
    return sendError(res, err, "resendOTP");
  }
}

// POST /auth/refresh
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== "string" || refreshToken.trim() === "") {
      throw serviceError(CODES.INVALID_TOKEN);
    }

    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("base64url");
    const rawToken = await redisClient.get(`refresh:${refreshHash}`);
    if (!rawToken) throw serviceError(CODES.INVALID_REFRESH);

    let user_id;
    try {
      ({ user_id } = JSON.parse(rawToken));
    } catch {
      await redisClient.del(`refresh:${refreshHash}`);
      throw serviceError(CODES.INVALID_REFRESH);
    }

    // Rotate: delete old BEFORE issuing new (prevents replay of old token).
    const execResult = await redisClient
      .multi()
      .del(`refresh:${refreshHash}`)
      .srem(`refresh:user:${user_id}`, refreshHash)
      .exec();
    if (execResult.some(([err]) => err)) throw serviceError(CODES.INTERNAL);

    const tokens = await issueSession(user_id);
    return res.status(200).json(tokens);
  } catch (err) {
    return sendError(res, err, "refresh");
  }
}

// POST /auth/logout
async function logout(req, res) {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken === "string" && refreshToken.length > 0) {
      const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("base64url");
      const rawToken = await redisClient.get(`refresh:${refreshHash}`);
      
      if (rawToken) {
        try {
          const { user_id } = JSON.parse(rawToken);
          await authService.logout(user_id, refreshHash);
        } catch { /* ignore malformed */ }
      }
    }
    return res.status(204).send();
  } catch (err) {
    return sendError(res, err, "logout");
  }
}

module.exports = { signup, login, verifyOTP, resendOTP, refresh, logout };