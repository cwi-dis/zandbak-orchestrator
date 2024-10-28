import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import User from "../app/user";
import ErrorCodes  from "./error_codes";
import EmittedEvents from "../app/emitted_events";

const installHandlers = (user: User) => {
  const { socket } = user;

  /**
   * Sends a scene event to the master of the user's current session. If the
   * user is not in any session, the request data is empty or the session has
   * no master, an error is issued.
   */
  socket.on(EndpointNames.SEND_SCENE_EVENT_TO_MASTER, (sceneEvent, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_MASTER, "User not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!sceneEvent) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_MASTER, "Scene event not specified");

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_NO_DATA
      ));
    }

    const { master } = session;
    if (!master) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_MASTER, "Session has no master");

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_NO_MASTER
      ));
    }

    logger.silly(EndpointNames.SEND_SCENE_EVENT_TO_MASTER, "Sending scene event to master");

    master.sendSceneEvent(
      EmittedEvents.SCENE_EVENT_TO_MASTER,
      user,
      sceneEvent
    );
  });

  /**
   * Sends a scene event from a session master to a regular user. If the
   * master is not in any session or the request data is empty, an error is
   * issued. An error is also returned if the calling user is not the master of
   * their session.
   */
  socket.on(EndpointNames.SEND_SCENE_EVENT_TO_USER, (targetId, sceneEvent, callback) => {
    const { session } = user;
    if (!session) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_USER, "User not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!session.isMaster(user)) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_USER, "User", user.name, "is not the master of session", session.name);

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_USER_IS_NOT_MASTER
      ));
    }

    if (!targetId) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_USER, "Target user ID not specified");

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_NO_TARGET_ID
      ));
    }

    const targetUser = session.getUser(targetId);
    if (!targetUser) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_USER, "Target user with ID", targetId, "not found in session", session.name);

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_SESSION
      ));
    }

    if (!sceneEvent) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_USER, "Scene event not specified");

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_NO_DATA
      ));
    }

    logger.silly(EndpointNames.SEND_SCENE_EVENT_TO_USER, "Sending scene event from master", user.name, "to", targetUser.name, "in session", session.name);

    targetUser.sendSceneEvent(
      EmittedEvents.SCENE_EVENT_TO_USER,
      user,
      sceneEvent
    );
  });

  /**
   * Sends a scene event from a session master to all users of the session. If
   * the master is not in any session or the request data is empty, an error is
   * issued. An error is also returned if the calling user is not the master of
   * their session.
   */
  socket.on(EndpointNames.SEND_SCENE_EVENT_TO_ALL, (sceneEvent, callback) => {
    const { session } = user;
    if (!session) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_ALL, "User not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!session.isMaster(user)) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_ALL, "User", user.name, "is not the master of session", session.name);

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_USER_IS_NOT_MASTER
      ));
    }

    if (!sceneEvent) {
      logger.warn(EndpointNames.SEND_SCENE_EVENT_TO_ALL, "Request contains no scene event data");

      return callback?.(util.createResponse(
        ErrorCodes.SCENE_EVENT_NO_DATA
      ));
    }

    logger.silly(EndpointNames.SEND_SCENE_EVENT_TO_ALL, "Sending scene event from master", user.name, "to all in session", session.name);
    session.sendSceneEvent(sceneEvent);
  });
};

export default installHandlers;
