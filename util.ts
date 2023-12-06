import * as fs from "fs";
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

enum LogLevel {
  DEBUG,
  DISABLED
}

/**
 * Prints the passed values to the standard output, prefixed by a current
 * timestamp. The first parameter designates log level and can also be used to
 * disable logging.
 *
 * @param logLevel Log level, can also be used for disabling logging altogether
 * @param logData Values that will be printed to the log
 */
export function log(logLevel: LogLevel, ...logData: Array<any>) {
  if (logLevel == LogLevel.DISABLED) {
    return;
  }

  const date = new Date();
  console.log(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`, ...logData);
}

/**
 * Loads the contents of a file identified by the given path and tries to parse
 * it as JSON. A promise is returned which, when resolved, contains the JSON
 * data structure loaded from the file.
 *
 * @param path Path to config file to load
 * @returns A promise which, when resolved, contains the contents of the loaded file
 */
export async function loadConfig(path: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(JSON.parse(data.toString()));
    });
  });
}

/**
 * Creates an object intended to be passed as a response to a request from a
 * client containing an error code and an optional response body.
 *
 * @param error Error code for the response object
 * @param body Body object to be passed along in the response (optional)
 * @returns The response object containing the data passed in and an error message
 */
export function createResponse(error: ErrorCodes, body: Object = {}) {
  return {
    error, body,
    message: ErrorMessages[error]
  };
}

/**
 * Creates an object intended to be passed as a response to a command from a
 * client containing the original command, an error code and an optional
 * response body.
 *
 * @param msg The original command message received from the client
 * @param error Error code for the response object
 * @param body Body object to be passed along in the response (optional)
 * @returns The response object containing the original command name, the data passed in and an error message
 */
export function createCommandResponse(msg: Object, error: ErrorCodes, body: Object = {}) {
  const { commandId } = msg;

  return {
    ...createResponse(error, body),
    commandId
  };
}

/**
 * Maps a JS Hash object to a regular JS object using a given mapping function.
 *
 * @param hash JS Hash object to be converted to a JS object
 * @param fn Mapping function to be applied to every item in the hash
 * @returns A JS object containing every item from the input, transformed by the mapping function
 */
export function mapHashToDict<T, U>(hash: Map<T, U>, fn: (tuple: [T, U]) => [T, any]) {
  return Object.fromEntries([...hash].map(fn));
}
