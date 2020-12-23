exports.SECRET = 'test-secret'

exports.ERROR_CODES = {
  ACCOUNT_EXISTS: 10000,
  USERNAME_PASSWORD_ERROR: 10001,
  BOOKS_FIELDS: 10002,
  SOURCES_FIELDS: 10002
}

exports.ERROR_MESSAGE = {
  [exports.ERROR_CODES.ACCOUNT_EXISTS]: "账号已存在",
  [exports.ERROR_CODES.USERNAME_PASSWORD_ERROR]: "账号或者密码错误",
  [exports.ERROR_CODES.BOOKS_FIELDS]: "name或者lastUrl错误",
  [exports.ERROR_CODES.SOURCES_FIELDS]: "bookSourceUrl错误",
}