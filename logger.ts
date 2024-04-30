import { createLogger, format, transports } from "winston";
import socketIOTransport from "winston-socket.io";

import { getFromEnvironment } from "./util";
import EndpointNames from "./endpoints/endpoint_names";

const [ PORT ] = getFromEnvironment(["LOG_LEVEL", "PORT"]);
const [ LOG_LEVEL ] = getFromEnvironment(["LOG_LEVEL"], "debug");
const [ LOG_FILE, LOG_SERVER ] = getFromEnvironment(["LOG_FILE", "LOG_SERVER"], null);

/**
 * Creates a new logger instance that prints log messages to stdout.
 */
const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: "[[]YYYY-MM-DD HH:mm:ss.SSS[]]"
    }),
    format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  transports: [new transports.Console()]
});

// If LOG_FILE variable is set, send logs to filename specified in LOG_FILE
if (LOG_FILE) {
  logger.add(new transports.File({
    filename: LOG_FILE,
    maxsize: 500_000,
    maxFiles: 10
  }));
}

// If LOG_SERVER variable is set, install Socket.IO transport for winston logger
if (LOG_SERVER) {
  logger.add(new socketIOTransport({
    host: "localhost",
    port: parseInt(PORT),
    namespace: "log"
  }));
}

/**
 * Augments a given logger function by allowing the passing in of a variable
 * number of arguments. Moreover, if the first arugment is a valid endpoint
 * name, it is uppercased and wrapped in square brackets for easier
 * identification. Returns the augmented logger function.
 *
 * @param fn Logger function to augment
 * @returns Augmented logger function taking variable arguments
 */
function formatLogMessage(fn: (msg: string) => void) {
  return (...message: any[]) => {
    const [endpoint] = message;

    if (Object.values(EndpointNames).includes(endpoint)) {
      fn([`[${endpoint.toUpperCase()}]`].concat(message.slice(1)).join(" "));
      return;
    }

    fn(message.join(" "));
  };
}

// Augment logger functions for each log level, allowing the passing in of a
// variable number of arguments
export default {
  error: formatLogMessage(logger.error),
  warn: formatLogMessage(logger.warn),
  info: formatLogMessage(logger.info),
  http: formatLogMessage(logger.http),
  verbose: formatLogMessage(logger.verbose),
  debug: formatLogMessage(logger.debug),
  silly: formatLogMessage(logger.silly)
};
