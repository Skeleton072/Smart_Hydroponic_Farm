const authService = require("../services/auth.service");
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

    return res.status(200).json({ message: "Successfully logged in.", user_id });
  } catch (error) {
    return handleError(res, error, "login");
  }
}

/**
 * POST /auth/verifyOTP
 * Body: { email, otp }
 */
async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!validateEmail(email) || otp.length != 6) {
      const err = new Error("Invalid input");
      err.code = "INVALID_INPUT";
      throw err;
    }

    const user_id = await authService.verifyOtp(email, otp);

    return res.status(200).json({ message: "Account created successfully. Welcome!", user_id });
  } catch (error) {
    return handleError(res, error, "verifyOTP");
  }
}

/**
 * POST /auth/resendOTP
 * Body: { email }
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

module.exports = { signup, login, verifyOTP, resendOTP };