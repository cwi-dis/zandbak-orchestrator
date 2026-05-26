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
   * the shared object's ID, initial position and rotation as parameters.
  */
  socket.on(EndpointNames.REGISTER_SHARED_OBJECT, (data, callback) => {
    const { id, position, rotation }: { id: string, position: util.Vector3, rotation: util.Quaternion } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.REGISTER_SHARED_OBJECT, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    if (session.getObject(id)) {
      logger.debug(EndpointNames.REGISTER_SHARED_OBJECT, "Shared object with id", id, "already registered");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_OBJECT_ALREADY_REGISTERED));
    }

    const obj = new SharedObject(id, user, {
      position, rotation, timestamp: Date.now()
    });

    session.addObject(obj);
    session.sendSessionUpdate("OBJECT_REGISTERED", obj.serialize());

    logger.debug(EndpointNames.REGISTER_SHARED_OBJECT, "Shared object with ID", id, "registered");

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      obj.serialize()
    ));
  });

  /**
   * Registers a new trigger object within the user's current session. If the
   * current user is not in any session, the call fails. The endpoint expects
   * the trigger object's initial data value and ID.
  */
  socket.on(EndpointNames.REGISTER_TRIGGER, (data, callback) => {
    const { id, initialValue } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.REGISTER_SHARED_OBJECT, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const trigger = new Trigger(id, user, initialValue);
    session.addTrigger(trigger);
    session.sendSessionUpdate("TRIGGER_REGISTERED", trigger.serialize());

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
  socket.on(EndpointNames.CLAIM_OWNERSHIP, (data, callback) => {
    const { objectId, type }: { objectId: string, type: "object" | "trigger" } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.CLAIM_OWNERSHIP, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const obj = (type == "object") ? session.getObject(objectId) : session.getTrigger(objectId);

    if (!obj) {
      logger.debug(EndpointNames.CLAIM_OWNERSHIP, "Session has no object with id", objectId);
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_OBJECT_DOES_NOT_EXIST));
    }

    if (obj.owner.id != user.id) {
      obj.owner = user;
      session.sendSessionUpdate("OBJECT_OWNERSHIP_CHANGED", obj.serialize());
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      obj.serialize()
    ));
  });

  /**
   * Spawns a new shared object within the user's current session. If the
   * current user is not in any session, the call fails. The endpoint expects
   * the shared object's ID, initial position and rotation and the name of the
   * prefab to be spawned as parameters.
  */
  socket.on(EndpointNames.SPAWN_SHARED_OBJECT, (data, callback) => {
    const { id, position, rotation, prefabName }: { id: string, position: util.Vector3, rotation: util.Quaternion, prefabName: string } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.SPAWN_SHARED_OBJECT, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const obj = new SharedObject(id, user, {
      position, rotation, timestamp: Date.now()
    }, prefabName);

    session.addObject(obj);
    session.sendSessionUpdate("OBJECT_SPAWNED", obj.serialize());

    logger.debug(EndpointNames.SPAWN_SHARED_OBJECT, "Shared object with ID", id, "spawned");

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      obj.serialize()
    ));
  });

  /**
   * Destroys the shared object with the given ID in the user's current session.
   * If the current user is not in any session, the call fails. The endpoint
   * expects the ID of the object to be destroyed as parameter.
   *
   * If no object with the given ID could be found in the current session, the
   * call fails.
  */
  socket.on(EndpointNames.DESTROY_SHARED_OBJECT, (data, callback) => {
    const { id }: { id: string } = data;
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.DESTROY_SHARED_OBJECT, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const objectToRemove = session.getObject(id);

    if (!objectToRemove) {
      logger.debug(EndpointNames.DESTROY_SHARED_OBJECT, "No object with ID", id, "found");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_OBJECT_DOES_NOT_EXIST));
    }

    session.removeObject(objectToRemove);
    session.sendSessionUpdate("OBJECT_DESTROYED", objectToRemove.serialize());

    logger.debug(EndpointNames.DESTROY_SHARED_OBJECT, "Shared object with ID", id, "destroyed");

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      objectToRemove.serialize()
    ));
  });
};

export default installHandlers;
