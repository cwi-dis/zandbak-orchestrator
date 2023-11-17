enum ErrorCodes {
  OK = 0,
  MISSING_CREDENTIALS = 204
}

export const ErrorMessages: { [key in ErrorCodes]: string } = {
  [ErrorCodes.OK]: "OK",
  [ErrorCodes.MISSING_CREDENTIALS]: "The user credentials are missing"
};

export default ErrorCodes;
