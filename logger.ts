import { createLogger, format, transports } from "winston";
import socketIOTransport from "winston-socket.io";

import { getFromEnvironment } from "./util";
import EndpointNames from "./endpoints/endpoint_names";

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
const logger = createLogger({
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

export default logger;
