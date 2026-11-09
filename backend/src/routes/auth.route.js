const express = require("express");
const { signup, login, verifyOTP, resendOTP, refresh, logout } = require("../controllers/auth.controller");
const rateLimit = require("express-rate-limit");
const authRouter = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true });
const otpLimiter  = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true });

authRouter.post("/login", authLimiter, login);
authRouter.post("/signup", authLimiter, signup);
authRouter.post("/verifyOTP", otpLimiter, verifyOTP);
authRouter.post("/resendOTP", otpLimiter, resendOTP);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authLimiter, logout);

module.exports = authRouter;