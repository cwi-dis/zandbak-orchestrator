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

  /**
   * Updates the `userData` property for the current user. The updated user
   * data object is returned in the response. A notification is also sent to
   * all session members. If the request does not contain the field
   * `userDataJson`, an error is issued.
   */
  socket.on(EndpointNames.UPDATE_USER_DATA, (data, callback) => {
    const { userDataJson } = data;
    const { session } = user;

    if (!userDataJson) {
      return callback(util.createCommandResponse(
        data,
        ErrorCodes.USER_DATA_MISSING_DATA_JSON
      ));
    }

    const userData = user.updateUserData(userDataJson);

    if (session) {
      session.sendSessionUpdate("USER_DATA_UPDATED", {
        userId: user.id,
        userData
      });
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      userData
    ));
  });
};

export default installHandlers;
