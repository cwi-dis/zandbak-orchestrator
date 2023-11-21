import ErrorCodes, { ErrorMessages } from "./endpoints/error_codes";

export type Optional<T> = T | undefined;
export type Object = { [key: string]: any };

/**
 * Tries to extract the values of the keys given as parameters from the
 * environment and throws an excaption if one of them cannot be found.
 *
 * @param keys Names of the keys that shall be extracted from the environment
 * @returns The values of the extracted keys as an array of strings
 */
export function getFromEnvironment(...keys: Array<string>): Array<string> {
  return keys.reduce<Array<string>>((values, k) => {
    const value = process.env[k];

    // Throw exception if value is not present in environment
    if (value === undefined) {
      throw new Error(`Environment has no key ${k}`);
    }

    return values.concat(value);
  }, []);
}

export function log(logLevel: "disabled" | "debug", ...logData: Array<any>) {
  if (logLevel == "disabled") {
    return;
  }

  const date = new Date();
  console.log(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`, ...logData);
}

export function loadConfig(path: string): Object {
  return require(path);
}

export function createResponse(error: ErrorCodes, body: object = {}) {
  return {
    error, body,
    message: ErrorMessages[error]
  };
}

export function createCommandResponse(msg: Object, error: ErrorCodes, body: Object = {}) {
  const { commandId } = msg;

  return {
    ...createResponse(error, body),
    commandId
  };
}
