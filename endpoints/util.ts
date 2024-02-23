import { Socket } from "socket.io";

import * as util from "../util";
import logger from "../logger";
import EndpointNames from "./endpoint_names";
import ErrorCodes from "./error_codes";

const installHandlers = (socket: Socket) => {
  /**
   * Returns the version of the orchestrator inside a JSON object.
   */
  socket.on(EndpointNames.GET_ORCHESTRATOR_VERSION, (data, callback) => {
    logger.debug(EndpointNames.GET_ORCHESTRATOR_VERSION, "Getting orchestrator version");

    callback(util.createCommandResponse(data, ErrorCodes.OK, {
      orchestratorVersion: util.ORCHESTRATOR_VERSION
    }));
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
      callback(util.createCommandResponse(data, ErrorCodes.NTP_ERROR));
    }
  });
};

export default installHandlers;
