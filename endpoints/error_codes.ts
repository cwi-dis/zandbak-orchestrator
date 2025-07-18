enum ErrorCodes {
  OK = 0,
  MISSING_CREDENTIALS = 204,
  USER_EXISTS = 205,
  INVALID_CREDENTIALS = 206,

  SESSION_ADD_FAILED = 404,
  SESSION_DELETE_UNAUTHORIZED = 501,
  SESSION_NOT_FOUND = 503,
  SESSION_NOT_EMPTY = 504,
  SESSION_USER_ALREADY_IN_OTHER_SESSION = 602,
  SESSION_USER_ALREADY_IN_SESSION = 603,
  SESSION_USER_NOT_IN_SESSION = 700,
  SESSION_USER_NOT_IN_ANY_SESSION = 800,
  SESSION_USER_ACTION_NOT_ALLOWED = 801,
  SESSION_USER_NOT_IN_SAME_SESSION = 802,
  SESSION_IS_SPEAKING_FLAG_NOT_SET = 803,
  SESSION_IS_SHARING_FLAG_NOT_SET = 804,

  USER_DATA_USER_NOT_FOUND = 1301,
  USER_DATA_MISSING_DATA_JSON = 1700,

  NTP_ERROR = 2001,

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
  [ErrorCodes.INVALID_CREDENTIALS]: "The user credentials are invalid",
  [ErrorCodes.USER_EXISTS]: "A user with the same name is already logged in",

  [ErrorCodes.SESSION_ADD_FAILED]: "Could not create session",
  [ErrorCodes.SESSION_NOT_FOUND]: "The session was not found",
  [ErrorCodes.SESSION_DELETE_UNAUTHORIZED]: "You are not the administrator of this session",
  [ErrorCodes.SESSION_NOT_EMPTY]: "The session is not empty",
  [ErrorCodes.SESSION_USER_ALREADY_IN_SESSION]: "The user already in this session",
  [ErrorCodes.SESSION_USER_ALREADY_IN_OTHER_SESSION]: "The user already in a session",
  [ErrorCodes.SESSION_USER_NOT_IN_SESSION]: "The user has not joined any session",
  [ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION]: "The user is not in any session",
  [ErrorCodes.SESSION_USER_NOT_IN_SAME_SESSION]: "The target user is not in the same session",
  [ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED]: "The user is not allowed to perform this action",
  [ErrorCodes.SESSION_IS_SPEAKING_FLAG_NOT_SET]: "isSpeaking parameter is not set",
  [ErrorCodes.SESSION_IS_SHARING_FLAG_NOT_SET]: "isSharing parameter is not set",

  [ErrorCodes.USER_DATA_USER_NOT_FOUND]: "The user was not found",
  [ErrorCodes.USER_DATA_MISSING_DATA_JSON]: "User data (JSON) missing",

  [ErrorCodes.NTP_ERROR]: "Could not get NTP time",

  [ErrorCodes.SCENE_EVENT_NO_DATA]: "No event data has been provided",
  [ErrorCodes.SCENE_EVENT_NO_MASTER]: "No master for this session was found",
  [ErrorCodes.SCENE_EVENT_NO_TARGET_ID]: "Missing target user ID",
  [ErrorCodes.SCENE_EVENT_USER_IS_NOT_MASTER]: "The user is not the master of this session",

  [ErrorCodes.STREAM_DATA_MISSING_USER_NOT_PROVIDED]: "Missing user parameter",
  [ErrorCodes.STREAM_DATA_MISSING_KIND]: "Missing type for data stream"
};

export default ErrorCodes;
