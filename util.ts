import * as fs from "fs";
import * as ntp from "ntp-client";
import { createLogger, format, transports } from "winston";
import { Socket, Server } from "socket.io";
import socketIOTransport from "winston-socket.io";

import ErrorCodes, { ErrorMessages } from "./endpoints/error_codes";
import EndpointNames from "./endpoints/endpoint_names";

export type Optional<T> = T | undefined;
export type Dict = { [key: string]: any };

const packageInfo = require("./package.json");
export const ORCHESTRATOR_VERSION = packageInfo.version;

const [ LOG_LEVEL, PORT ] = getFromEnvironment(["LOG_LEVEL", "PORT"]);
const [ LOG_FILE, LOG_SERVER ] = getFromEnvironment(["LOG_FILE", "LOG_SERVER"], null);

/**
 * Takes any type of value and tries to convert it to a string by means of
 * `JSON.stringify()`. If the resulting value is enclosed by quotation marks,
 * there are stripped before the value is returned.
 *
 * @param arg Argument to be stringified
 * @returns Stringified argument
 */
function stringifyLogArg(arg: any) {
  const strArg = JSON.stringify(arg);

  if (strArg && strArg.startsWith("\"") && strArg.endsWith("\"")) {
    return strArg.slice(1, -1);
  }

  return strArg;
}

/**
 * Creates a new logger instance that prints log messages to stdout.
 */
export const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: "[[]YYYY-MM-DD HH:mm:ss.SSS[]]"
    }),
    format.printf((info) => {
      const metaArgs = info[Symbol.for("splat")]?.map(stringifyLogArg).join(" ");

      if (metaArgs) {
        if (Object.values(EndpointNames).includes(info.message)) {
          return `${info.timestamp} ${info.level}: [${info.message.toUpperCase()}] ${metaArgs}`;
        }

        return `${info.timestamp} ${info.level}: ${info.message} ${metaArgs}`;
      }

      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: LOG_FILE || "/dev/null",
      maxsize: 500_000,
      maxFiles: 10
    })
  ]
});

// If LOG_SERVER variable is set, install Socket.IO transport for winston logger
if (LOG_SERVER) {
  logger.add(new socketIOTransport({
    host: "localhost",
    port: parseInt(PORT),
    namespace: "log"
  }));
}

/**
 * Installs a handler on the given Socket.IO server, listening for the `log`
 * event and forwards them by re-emitting them as event `message` to the
 * namespace `/log`.
 *
 * @param io Socket.IO server
 */
export function installLogServerHandler(io: Server) {
  io.of("/log").on("connection", (socket) => {
    socket.on("log", (messages: Array<{message: string, level: string, timestamp: string}>) => {
      messages.forEach((message) => {
        io.of("/log").emit("message", message);
      });
    });
  });
}

/**
 * Tries to extract the values of the keys given as parameters from the
 * environment and throws an exception if one of them cannot be found. If the
 * param `defaultValue` is provided, this value will be returned for keys not
 * found in the enironment
 *
 * @param keys Names of the keys that shall be extracted from the environment
 * @returns The values of the extracted keys as an array of strings
 */
export function getFromEnvironment(keys: Array<string>, defaultValue?: any): Array<string> {
  return keys.reduce<Array<string>>((values, k) => {
    const value = process.env[k];

    // Throw exception if value is not present in environment
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Environment has no key ${k}`);
      }

      return values.concat(defaultValue);
    }

    return values.concat(value);
  }, []);
}

/**
 * Loads the contents of a file identified by the given path and tries to parse
 * it as JSON. A promise is returned which, when resolved, contains the JSON
 * data structure loaded from the file.
 *
 * @param path Path to config file to load
 * @returns A promise which, when resolved, contains the contents of the loaded file
 */
export async function loadConfig<T>(path: string): Promise<T> {
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
 * Loads the contents of a file identified by the given path synchronously and
 * tries to parse it as JSON. Returns the JSON data structure loaded from the
 * file.
 *
 * @param path Path to config file to load
 * @returns The contents of the loaded file as a JSON object
 */
export function loadConfigSync<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path).toString());
}

/**
 * Creates an object intended to be passed as a response to a request from a
 * client containing an error code and an optional response body.
 *
 * @param error Error code for the response object
 * @param body Body object to be passed along in the response (optional)
 * @returns The response object containing the data passed in and an error message
 */
export function createResponse(error: ErrorCodes, body: Dict = {}) {
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
export function createCommandResponse(msg: Dict, error: ErrorCodes, body: Dict = {}) {
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

/**
 * Tries to get the current time from a series of NTP servers listed in the
 * application config. Servers are tried in order until the first server that
 * returns a valid time. The result is returned as a `Date` object wrapped
 * inside a promise. If no servers returned a valid time, the promise will
 * reject with an error.
 *
 * @returns A promise which, when resolved, contains the current NTP time
 */
export async function getCurrentTime(): Promise<Date> {
  const { ntpConfig }: { ntpConfig: Array<{ server: string, port: number }> } = await loadConfig("config/ntp-config.json");

  return ntpConfig.reduce(async (result, { server, port }) => {
    try {
      return await result;
    } catch {
      return getNetworkTime(server, port);
    }
  }, Promise.reject<Date>());
}

/**
 * Tries to retrieve the current time from the given NTP server and port.
 * Returns a promise which resolves to a Date object if successful or rejects
 * with an error otherwise. This function is mainly a promise wrapper around
 * `util.getNetworkTime()`.
 *
 * @param server Hostname for the NTP server
 * @param port Port for the NTP server (defaults to 123)
 * @returns A promise containing the date, or an error if rejected
 */
function getNetworkTime(server: string, port: number = 123): Promise<Date> {
  return new Promise((resolve, reject) => {
    ntp.getNetworkTime(server, port, (err, date) => {
      if (err) {
        reject(err);
      } else {
        resolve(date!);
      }
    });
  });
}

/**
 * Installs a handler on the given socket which triggers a callback whenever an
 * unhandled event is received.
 *
 * @param socket SocketIO socket to install handler for
 * @param fn Callback function to be triggered when an unhandled event is received
 */
export function onUnhandled(socket: Socket, fn: (event: string, params: any) => void) {
  socket.onAny((event: string, ...params) => {
    if (socket.listeners(event).length == 0) {
      fn(event, params);
    }
  });
}
