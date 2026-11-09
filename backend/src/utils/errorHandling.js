class ServiceError extends Error {
  constructor(code, message, meta = {}) {
    super(message || code);
    this.name = "ServiceError";
    this.code = code;
    this.meta = meta;
    this.isServiceError = true;
  }
}

const CODES = Object.freeze({
  ACCOUNT_BLOCKED:     "ACCOUNT_BLOCKED",
  INVALID_INPUT:       "INVALID_INPUT",
  WRONG_OTP:           "WRONG_OTP",
  OTP_LOCKED:          "OTP_LOCKED",
  OTP_EXPIRED:         "OTP_EXPIRED",
  RESEND_COOLDOWN:     "RESEND_COOLDOWN",
  EMAIL_EXISTS:        "EMAIL_EXISTS",
  EMAIL_SEND_FAILED:   "EMAIL_SEND_FAILED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_TOKEN:       "INVALID_TOKEN",
  INVALID_REFRESH:     "INVALID_REFRESH",
  TOO_MANY_REQUESTS:   "TOO_MANY_REQUESTS",
  INTERNAL:            "INTERNAL",
});

const HTTP_MAP = {
  [CODES.ACCOUNT_BLOCKED]:     { status: 403, message: "Account blocked. Please contact support." },
  [CODES.INVALID_INPUT]:       { status: 400, message: "Invalid input." },
  [CODES.WRONG_OTP]:           { status: 400, message: "Incorrect verification code." },
  [CODES.OTP_LOCKED]:          { status: 429, message: "Too many failed attempts. Try again shortly." },
  [CODES.OTP_EXPIRED]:         { status: 410, message: "Verification session expired. Please sign up again." },
  [CODES.RESEND_COOLDOWN]:     { status: 429, message: "Please wait before requesting another code." },
  [CODES.EMAIL_EXISTS]:        { status: 409, message: "This email is already registered." },
  [CODES.EMAIL_SEND_FAILED]:   { status: 502, message: "Could not send email. Please try again." },
  [CODES.INVALID_CREDENTIALS]: { status: 401, message: "Invalid email or password." },
  [CODES.INVALID_TOKEN]:       { status: 401, message: "Invalid or missing token." },
  [CODES.INVALID_REFRESH]:     { status: 401, message: "Session expired. Please log in again." },
  [CODES.TOO_MANY_REQUESTS]:   { status: 429, message: "Too many requests. Please slow down." },
  [CODES.INTERNAL]:            { status: 500, message: "Something went wrong. Please try again." },
};

function serviceError(code, cause = null, meta = {}) {
  const err = new ServiceError(code, HTTP_MAP[code]?.message, meta);
  if (cause) err.cause = cause;
  return err;
}

function toHttpError(err) {
  const code = err?.isServiceError ? err.code : CODES.INTERNAL;
  const base = HTTP_MAP[code] ?? HTTP_MAP[CODES.INTERNAL];
  return {
    status: base.status,
    body: {
      code,
      message: base.message,
      ...(err?.meta?.ttl !== undefined ? { retryAfter: err.meta.ttl } : {}),
    },
  };
}

module.exports = { CODES, serviceError, toHttpError, ServiceError };