const config = require("../config/config");
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  console.log(token);
  console.log(config.jwt.accessTTLSeconds);

  if (!token) return res.status(401).json({ message: "Unauthorized.", code: "INVALID_TOKEN" });

  try {
    const payload = jwt.verify(token, config.jwt.accessTokenSecret, { algorithms: ["HS256"] });
    console.log("payload: ", payload);
    req.user = { user_id: payload.user_id };
    
    next();
  } catch {
    console.log("unauthorized");
    return res.status(401).json({ message: "Unauthorized.", code: "TOKEN_EXPIRED" });
  }
}

module.exports = { requireAuth };