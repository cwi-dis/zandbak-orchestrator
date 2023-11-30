enum ErrorCodes {
  OK = 0,
  MISSING_CREDENTIALS = 204,

  SESSION_DELETE_UNAUTHORIZED = 501,
  SESSION_NOT_FOUND = 503,
  SESSION_NOT_EMPTY = 504,
  SESSION_USER_ALREADY_IN_OTHER_SESSION = 602,
  SESSION_USER_ALREADY_IN_SESSION = 603,
  SESSION_USER_NOT_IN_ANY_SESSION = 800
}

export const ErrorMessages: { [key in ErrorCodes]: string } = {
  [ErrorCodes.OK]: "OK",
  [ErrorCodes.MISSING_CREDENTIALS]: "The user credentials are missing",

  [ErrorCodes.SESSION_NOT_FOUND]: "The session was not found",
  [ErrorCodes.SESSION_DELETE_UNAUTHORIZED]: "You are not the administrator of this session",
  [ErrorCodes.SESSION_NOT_EMPTY]: "The session is not empty",
  [ErrorCodes.SESSION_USER_ALREADY_IN_SESSION]: "The user already in this session",
  [ErrorCodes.SESSION_USER_ALREADY_IN_OTHER_SESSION]: "The user already in a session",
  [ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION]: "The user is not in any session"
};

export default ErrorCodes;
