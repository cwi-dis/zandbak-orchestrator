import { Socket } from "socket.io";

import * as util from "../util";
import logger from "../logger";
import EndpointNames from "./endpoint_names";
import ErrorCodes from "./error_codes";
import Orchestrator from "../app/orchestrator";

const installHandlers = (orchestrator: Orchestrator, socket: Socket) => {
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

  /**
   * Dumps the entire data tree of the orchestrator and sends it to the caller.
   */
  socket.on(EndpointNames.DUMP_DATA, (data, callback) => {
    logger.debug(EndpointNames.DUMP_DATA, "Dumping all orchestrator data");

    callback(
      util.createCommandResponse(data, ErrorCodes.OK, orchestrator.serialize())
    );
  });

  /**
   * Terminates the orchestrator process.
   */
  socket.on(EndpointNames.TERMINATE_ORCHESTRATOR, (callback) => {
    logger.debug(EndpointNames.TERMINATE_ORCHESTRATOR, "Terminating orchestrator");
    callback();

    process.exit(1);
  });
};

export default installHandlers;
