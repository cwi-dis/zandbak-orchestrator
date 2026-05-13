import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import ErrorCodes from "./error_codes";
import SharedObject from "../app/shared_object";
import Trigger from "../app/trigger";
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
  socket.on(EndpointNames.REGISTER_SHARED_OBJECT, (data, callback) => {
    const { position, rotation }: { position: util.Vector3, rotation: util.Quaternion } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.REGISTER_SHARED_OBJECT, "User", user.name, "not in any session");
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

  /**
   * Registers a new trigger object within the user's current session. If the
   * current user is not in any session, the call fails. The endpoint expects
   * the trigger object's initial data value.
   *
   * The object instance will receive a randomly generated ID, this ID, wrapped
   * in a serialised form of the object which will be returned to the caller.
   * The caller is expected to store this ID with their local copy of the
   * object as it will be used to identify broadcast messages.
  */
  socket.on(EndpointNames.REGISTER_TRIGGER, (data, callback) => {
    const { value } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.REGISTER_SHARED_OBJECT, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const trigger = new Trigger(user, value);
    session.addTrigger(trigger);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      trigger.serialize()
    ));
  });

  /**
   * Changes ownership of the object with the given ID to the current user
   * within the current session. If the current user is not in any session or
   * object with the given ID does not exist in the session, the call fails.
   * The endpoint expects the shared object's ID as a parameter.
   *
   * Upon successful changing of ownership, a session update is sent to all
   * session participants. If the current user is already the owner of the
   * object, nothing happens.
   */
  socket.on(EndpointNames.CLAIM_OBJECT_OWNERSHIP, (data, callback) => {
    const { objectId, type }: { objectId: string, type: "object" | "trigger" } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.CLAIM_OBJECT_OWNERSHIP, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const obj = (type == "object") ? session.getObject(objectId) : session.getTrigger(objectId);

    if (!obj) {
      logger.debug(EndpointNames.CLAIM_OBJECT_OWNERSHIP, "Session has no object with id", objectId);
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_OBJECT_DOES_NOT_EXIST));
    }

    if (obj.owner.id != user.id) {
      const oldOwnerId = obj.owner.id;
      obj.owner = user;

      session.sendSessionUpdate("OBJECT_OWNERSHIP_CHANGED", {
        id: obj.id,
        oldOwner: oldOwnerId,
        newOwner: user.id,
        type
      });
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      obj.serialize()
    ));
  });
};

export default installHandlers;
