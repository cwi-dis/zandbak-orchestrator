enum ErrorCodes {
  OK = 0,
  MISSING_CREDENTIALS = 204,

  SESSION_DELETE_UNAUTHORIZED = 501,
  SESSION_NOT_FOUND = 503,
  SESSION_NOT_EMPTY = 504,
  SESSION_USER_ALREADY_IN_OTHER_SESSION = 602,
  SESSION_USER_ALREADY_IN_SESSION = 603,
  SESSION_USER_NOT_IN_SESSION = 700,
  SESSION_USER_NOT_IN_ANY_SESSION = 800,
  SESSION_USER_NOT_IN_SAME_SESSION = 802,

  USER_DATA_USER_NOT_FOUND = 1301,
  USER_DATA_MISSING_DATA_JSON = 1700,

  SCENE_EVENT_NO_MASTER = 3001,
  SCENE_EVENT_NO_DATA = 3002,
  SCENE_EVENT_NO_TARGET_ID = 3014,
  SCENE_EVENT_USER_IS_NOT_MASTER = 3012,

  STREAM_DATA_MISSING_USER_NOT_PROVIDED = 4001,
  STREAM_DATA_MISSING_KIND = 4002,
}

export const ErrorMessages: { [key in ErrorCodes]: string } = {
  [ErrorCodes.OK]: "OK",
  [ErrorCodes.MISSING_CREDENTIALS]: "The user credentials are missing",

  [ErrorCodes.SESSION_NOT_FOUND]: "The session was not found",
  [ErrorCodes.SESSION_DELETE_UNAUTHORIZED]: "You are not the administrator of this session",
  [ErrorCodes.SESSION_NOT_EMPTY]: "The session is not empty",
  [ErrorCodes.SESSION_USER_ALREADY_IN_SESSION]: "The user already in this session",
  [ErrorCodes.SESSION_USER_ALREADY_IN_OTHER_SESSION]: "The user already in a session",
  [ErrorCodes.SESSION_USER_NOT_IN_SESSION]: "The user has not joined any session",
  [ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION]: "The user is not in any session",
  [ErrorCodes.SESSION_USER_NOT_IN_SAME_SESSION]: "The target user is not in the same session",

  [ErrorCodes.USER_DATA_USER_NOT_FOUND]: "The user was not found",
  [ErrorCodes.USER_DATA_MISSING_DATA_JSON]: "User data (JSON) missing",

  [ErrorCodes.SCENE_EVENT_NO_DATA]: "No event data has been provided",
  [ErrorCodes.SCENE_EVENT_NO_MASTER]: "No master for this session was found",
  [ErrorCodes.SCENE_EVENT_NO_TARGET_ID]: "Missing target user ID",
  [ErrorCodes.SCENE_EVENT_USER_IS_NOT_MASTER]: "The user is not the master of this session",

  [ErrorCodes.STREAM_DATA_MISSING_USER_NOT_PROVIDED]: "Missing user parameter",
  [ErrorCodes.STREAM_DATA_MISSING_KIND]: "Missing type for data stream"
};

export default ErrorCodes;
