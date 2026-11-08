const authService = require("../services/auth.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokenHandling");
const { validatePassword, validateEmail } = require("../utils/validate");

// HELPER FUNCTIONS
function toHttpError(err) {
  switch (err.code) {
    case "INVALID_INPUT":
      return { status: 400, message: "Invalid user credentials!" };
    case "WRONG_OTP":
      return { status: 400, message: "Wrong OTP!" };
    case "OTP_LOCKED":
      return { status: 429, message: "Too many failed attempts. Verification session locked." };
    case "OTP_EXPIRED":
      return { status: 410, message: "Verification session expired or not found." };
    case "RESEND_COOLDOWN":
      return { status: 429, message: "Please wait before requesting another code." };
    case "EMAIL_EXISTS":
      return { status: 409, message: "Email already registered." };
    case "INVALID_CREDENTIALS":
      return { status: 401, message: "Invalid email or password." };
    case "INVALID_TOKEN":
      return { status: 401, message: "Invalid token."};
    case "INVALID_REFRESH":
      return { status: 401, message: "Refresh token expired or somethng."};
    default:
      return { status: 500, message: "Something went wrong. Please try again." };
  }
}

function handleError(res, err, context) {
  console.error({ err, context }, `${context} failed`);
  
  const { status, message } = toHttpError(err);
  return res.status(status).json({ message });
}

/**
 * POST /auth/signup
 * Body: { user_name, email, password }
 * @returns { message }
 */
async function signup(req, res) {
  try {
    const { user_name, email, password } = req.body;

    if (!user_name || user_name.trim() === "" || !validatePassword(password) || !validateEmail(email)) {
      const err = new Error("Invalid input");
      err.code = "INVALID_INPUT";
      throw err;
    }

    await authService.startSignup(user_name, email, password);

    return res.status(200).json({ message: "Verification code sent to email." });
  } catch (error) {
    return handleError(res, error, "signup");
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 * @returns { message, accessToken, refreshToken }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email) || !validatePassword(password)) {
      const err = new Error("Invalid credentials");
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }

    const user_id = await authService.authenticate(email, password);

    const accessToken = await generateAccessToken({ user_id });
    const refreshToken = await generateRefreshToken({ user_id });

    return res.status(200).json({ message: "Successfully logged in.", accessToken, refreshToken });
  } catch (error) {
    return handleError(res, error, "login");
  }
}

/**
 * POST /auth/verifyOTP
 * Body: { email, otp }
 * @returns { message, accessToken, refreshToken }
 */
async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!validateEmail(email) || otp.length != 6) {
      const err = new Error("Invalid input");
      err.code = "INVALID_INPUT";
      throw err;
    }

    // should we use transaction in case generating token goes wrong
    const user_id = await authService.verifyOtp(email, otp);

    const accessToken = await generateAccessToken({ user_id });
    const refreshToken = await generateRefreshToken({ user_id });

    return res.status(200).json({ message: "Account created successfully. Welcome!", accessToken, refreshToken });
  } catch (error) {
    return handleError(res, error, "verifyOTP");
  }
}

/**
 * POST /auth/resendOTP
 * Body: { email }
 * @returns { message }
 */
async function resendOTP(req, res) {
  try {
    const { email } = req.body;
    
    if (!validateEmail(email)) {
      const err = new Error("Invalide input");
      err.code = "INVALID_INPUT";
      throw err
    }

    await authService.resendOtp( email );

    return res.status(200).json({ message: "Verification code resent." });
  } catch (error) {
    return handleError(res, error, "resendOTP");
  }
}

/**
 * POST /auth/refresh
 * Body: { refreshToken }
 * @returns { accessToken, refreshToken }
 */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken.trim() == "") {
      const err = new Error("Missing Token!");
      err.code = "INVALID_TOKEN";
      throw err;
    }

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("base64url");
    const rawToken = await redisClient.get(`refresh:${refreshHash}`);
    if (!rawToken) {
      const err = new Error("Invalid or expired refresh token");
      err.code = "INVALID_REFRESH";
      throw err;
    }

    const { user_id } = JSON.parse(rawToken);

    await redisClient.multi()
      .del(`refresh:${refreshHash}`)
      .sRem(`refresh:user:${user_id}`, refreshHash)
      .exec();

    const newAccessToken = await generateAccessToken({ user_id });
    const newRefreshToken = await generateRefreshToken({ user_id });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return handleError(res, error, "refresh");
  }
}

module.exports = { signup, login, verifyOTP, resendOTP, refresh };