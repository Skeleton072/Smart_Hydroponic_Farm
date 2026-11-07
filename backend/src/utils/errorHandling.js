function serviceError(code, cause) {
  const err = new Error(code);
  err.code = code;
  if (cause) err.cause = cause;
  return err;
}

module.exports = { serviceError };