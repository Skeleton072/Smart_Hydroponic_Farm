const express = require("express");
const { signup, login, verifyOTP, resendOTP, refresh } = require("../controllers/auth.controller");
const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/signup", signup);
authRouter.post("/verifyOTP", verifyOTP);
authRouter.post("/resendOTP", resendOTP);
authRouter.post("/refresh", refresh);

module.exports = authRouter;