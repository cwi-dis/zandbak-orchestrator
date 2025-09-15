import * as util from "../util";
import logger from "../logger";

import ErrorCodes from "./error_codes";
import EndpointNames from "./endpoint_names";
import User from "../app/user";


const installHandlers = (user: User) => {
  const { socket } = user;

  /**
   * Creates a new conversation bubble within the users current session with
   * the given name. The current user is added as owner to the created bubble.
   * If no name is given the new bubble's name will be set to 'Conversation
   * Bubble'. If the user is in no session, an error is issued.
   *
   * Upon success, a serialised version of the newly created bubble is returned
   * to the caller.
   */
  socket.on(EndpointNames.CREATE_BUBBLE, (data, callback) => {
    const { session } = user;
    const { name = "Conversation Bubble" } = data;

    if (!session) {
      logger.debug(EndpointNames.CREATE_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const bubble = session.createBubble(name, user);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      bubble.serialize()
    ));
  });
};

export default installHandlers;
