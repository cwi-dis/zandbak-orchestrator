import * as util from "../util";
import { logger } from "../util";
import EndpointNames from "./endpoint_names";
import User from "../app/user";
import ErrorCodes from "./error_codes";

const packageInfo = require("../package.json");

const installHandlers = (user: User) => {
  const { socket } = user;

  /**
   * Returns the version of the orchestrator inside a JSON object.
   */
  socket.on(EndpointNames.GET_ORCHESTRATOR_VERSION, (data, callback) => {
    logger.debug(EndpointNames.GET_ORCHESTRATOR_VERSION, "Getting orchestrator version");

    callback(util.createCommandResponse(data, ErrorCodes.OK), {
      orchestratorVersion: packageInfo.version
    });
  });

  /**
   * Returns the current time as determined using NTP.
   */
  socket.on(EndpointNames.GET_NTP_TIME, async (data, callback) => {
    try {
      const date = await util.getCurrentTime();
      logger.debug(EndpointNames.GET_NTP_TIME, "Getting NTP time:", date);

      callback(util.createCommandResponse(data, ErrorCodes.OK, {
        ntpDate: date,
        ntpTimeMs: date!.getTime()
      }));
    } catch (err) {
      logger.error("Could not get NTP time:", err);
    }
  });

  /**
   * Ends the orchestrator process.
   */
  socket.on(EndpointNames.EXIT_ORCHESTRATOR, () => {
    logger.debug(EndpointNames.EXIT_ORCHESTRATOR, "Received exit command");
    process.exit(1);
  });
};

export default installHandlers;
