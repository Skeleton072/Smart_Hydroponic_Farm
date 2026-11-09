const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,64}$/;
const OTP_REGEX = /^\d{6}$/;

const MAX_NAME_LEN = 80;
const MAX_EMAIL_LEN = 254;

function validateEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length <= 64 && PASSWORD_REGEX.test(password);
}

function validatePasswordForLogin(password) {
  return typeof password === "string" && password.length > 0 && password.length <= 64;
}

function validateOtp(code) {
  return typeof code === "string" && OTP_REGEX.test(code);
}

function validateName(name) {
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= MAX_NAME_LEN;
}
  

module.exports = {
  validateEmail,
  validatePassword,
  validatePasswordForLogin,
  validateOtp,
  validateName,
  PASSWORD_REGEX,
  EMAIL_REGEX,
};