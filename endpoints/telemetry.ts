import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes from "./error_codes";
import { TelemetryData } from "../app/telemetry";

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  /**
   * Updates the telemetry data for the current user.
   */
  socket.on(EndpointNames.REPORT_TELEMETRY, (data, callback) => {
    const { telemetry } = data;

    if (!telemetry) {
      logger.warn(EndpointNames.REPORT_TELEMETRY, "Request contains no telemetry data");
      return callback(util.createCommandResponse(data, ErrorCodes.MISSING_PARAMETER));
    }

    // Basic validation
    if (typeof telemetry.rttMs !== "number" ||
        typeof telemetry.jitterMs !== "number" ||
        typeof telemetry.packetLossRate !== "number" ||
        typeof telemetry.timestamp !== "number") {
      logger.warn(EndpointNames.REPORT_TELEMETRY, "Invalid telemetry data types");
      return callback(util.createCommandResponse(data, ErrorCodes.MISSING_PARAMETER));
    }

    user.telemetry = telemetry as TelemetryData;
    logger.debug(EndpointNames.REPORT_TELEMETRY, "Updated telemetry for", user.name);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      user.telemetry
    ));
  });
};

export default installHandlers;
