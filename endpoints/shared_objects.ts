import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import ErrorCodes from "./error_codes";
import SharedObject from "../app/shared_object";
import User from "../app/user";

const installHandlers = (user: User) => {
  const { socket } = user;

  /**
   * Registers a new shared object within the user's current session. If the
   * current user is not in any session, the call fails. The endpoint expects
   * the shared object's initial position and rotation as parameters.
   *
   * The object instance will receive a randomly generated ID, this ID, wrapped
   * in a serialised form of the object which will be returned to the caller.
   * The caller is expected to store this ID with their local copy of the
   * object as it will be used to identify broadcast messages.
  */
  socket.on(EndpointNames.REGISTER_SHARED_OBJECT, async (data, callback) => {
    const { position, rotation }: { position: util.Vector3, rotation: util.Quaternion} = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.CREATE_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const obj = new SharedObject(user, {
      position, rotation, timestamp: Date.now()
    });

    session.addObject(obj);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      obj.serialize()
    ));
  });
};

export default installHandlers;
