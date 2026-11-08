const config = require("../config/config");

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.replace(/^Bearer\s+/i, "");

  if (!token) return res.status(401).json({ message: "Unauthorized.", code: "INVALID_TOKEN" });

  try {
    const payload = jwt.verify(token, config.jwt.accessTokenSecret, { algorithms: ["HS256"] });
    req.user = { user_id: payload.user_id };
    
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized.", code: "TOKEN_EXPIRED" });
  }
}

module.exports = { requireAuth };