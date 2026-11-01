const express = require("express");
const { signup, login, verifyOTP } = require("../controllers/auth.controller");
const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/signup", signup);
authRouter.post("/verifyOTP", verifyOTP);

module.exports = authRouter;