import * as ntp from "ntp-client";

import * as util from "../util";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes from "./error_codes";

const packageInfo = require("../package.json");

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  socket.on(EndpointNames.GET_ORCHESTRATOR_VERSION, (data, callback) => {
    callback(util.createCommandResponse(data, ErrorCodes.OK), {
      orchestratorVersion: packageInfo.version
    });
  });

  socket.on(EndpointNames.GET_NTP_TIME, (data, callback) => {
    const ntpConfig = util.loadConfig("../config/ntp-config.json");

    ntp.getNetworkTime(ntpConfig.server, ntpConfig.port, (err, date) => {
      if (!err) {
        callback(util.createCommandResponse(data, ErrorCodes.OK, {
          ntpDate: date,
          ntpTimeMs: date!.getTime()
        }));
      }
    });
  });

  socket.on(EndpointNames.EXIT_ORCHESTRATOR, () => {
    process.exit(1);
  });
};

export default installHandlers;
