import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes from "./error_codes";

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
      logger.warn(EndpointNames.GET_USER_DATA, "Target user not found");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.USER_DATA_USER_NOT_FOUND
      ));
    }

    logger.debug(EndpointNames.GET_USER_DATA, "Getting user data for", targetUser.name);

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
      logger.warn(EndpointNames.UPDATE_USER_DATA, "Request contains no user data");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.USER_DATA_MISSING_DATA_JSON
      ));
    }

    const userData = user.updateUserData(userDataJson);
    logger.debug(EndpointNames.UPDATE_USER_DATA, "Updated user data for", user.name);

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

  /**
   * Updates the `status` property for the current user. The updated status
   * is returned in the response. A notification is also sent to all session
   * members.
  */
  socket.on(EndpointNames.SET_USER_STATUS, (data, callback) => {
    const { status } = data;
    const { session } = user;

    logger.debug(EndpointNames.SET_USER_STATUS, "Setting user status for", user.name, "to", status);
    user.status = status;

    if (session) {
      session.sendSessionUpdate("USER_STATUS_UPDATED", {
        userId: user.id,
        status
      });
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      status
    ));
  });

  /**
   * Returns a serialised version of the user object identified by the given
   * user ID. If no ID is given the data for the current user is returned. If
   * an ID is given, but could not be found, an error is returned.
   */
  socket.on(EndpointNames.GET_USER_INFO, (data, callback) => {
    const { userId } = data;
    const userToReturn = orchestrator.getUser(userId || user.id);

    if (!userToReturn) {
      logger.debug(EndpointNames.GET_USER_INFO, "No user with ID", userId, "found");
      return callback(util.createCommandResponse(data, ErrorCodes.USER_DATA_USER_NOT_FOUND));
    }

    logger.debug(EndpointNames.GET_USER_INFO, "Getting info for user", userId);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      user.serialize()
    ));
  });
};

export default installHandlers;
