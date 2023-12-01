import * as util from "../util";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  /**
   * Returns the `userData` object associated to a user identified by the key
   * `userId` in the request. If no such key is found, the `userData` for the
   * current user is returned. If a user ID is given and no associated user
   * could be found, an error is issued.
   */
  socket.on(EndpointNames.GET_USER_DATA, (data, callback) => {
    const targetUser = (data.userId) ? orchestrator.getUser(data.userId) : user;

    if (!targetUser) {
      return callback(util.createCommandResponse(
        data,
        ErrorCodes.USER_DATA_USER_NOT_FOUND
      ));
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      targetUser.userData
    ));
  });
};

export default installHandlers;
