import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";
import Session from "../app/session";
import Scenario from "../app/scenario";

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  /**
   * Endpoint invoked for the user to create a new session with the given data.
   * Returns a serialised version of the session to the caller upon success.
   */
  socket.on(EndpointNames.ADD_SESSION, (data, callback) => {
    const {
      sessionName, sessionDescription, sessionProtocol = "unknown",
      scenarioDefinition: { scenarioId, scenarioName, scenarioDescription }
    } = data;

    logger.debug(EndpointNames.ADD_SESSION, "Creating new session with name", sessionName);

    try {
      const session = new Session(
        sessionName.trim(),
        sessionDescription,
        sessionProtocol,
        new Scenario(scenarioId, scenarioName, scenarioDescription),
        orchestrator.transportManager
      );

      logger.debug(EndpointNames.ADD_SESSION, "Adding user", user.name, "as admin to new session", session.name);

      session.addUser(user);
      session.setAdministrator(user);
      orchestrator.addSession(session);

      callback(util.createCommandResponse(
        data,
        ErrorCodes.OK,
        session.serialize()
      ));
    } catch (err) {
      logger.error(EndpointNames.ADD_SESSION, "Error during session creation:", err);

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_ADD_FAILED
      ));
    }
  });

  /**
   * Deletes a session given by its session ID. The calling user must be the
   * administrator of the session and the session must be empty for the call
   * to be successful.
   */
  socket.on(EndpointNames.DELETE_SESSION, (data, callback) => {
    const { sessionId } = data;
    const session = orchestrator.getSession(sessionId);

    if (!session) {
      logger.warn(EndpointNames.DELETE_SESSION, "No session with ID", sessionId);
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_FOUND));
    }

    const { administrator } = session;
    if (administrator.id != user.id) {
      logger.warn(EndpointNames.DELETE_SESSION, "User", user.name, "is not the admin of session", session.name);
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_DELETE_UNAUTHORIZED));
    }

    if (!session.isEmpty()) {
      logger.warn(EndpointNames.DELETE_SESSION, "Session", session.name, "is not empty");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_EMPTY));
    }

    logger.debug(EndpointNames.DELETE_SESSION, "Deleting session", session.name);

    orchestrator.removeSession(session);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  /**
   * Returns a serialised object of active sessions to the caller indexed by
   * session ID.
   */
  socket.on(EndpointNames.GET_SESSIONS, (data, callback) => {
    logger.debug(EndpointNames.GET_SESSIONS, "Getting all sessions");

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      orchestrator.sessions
    ));
  });

  /**
   * Returns a serialised version of the user's current session or the session
   * that this user is an admin of. If the user is not in any session or not an
   * admin of any session, an error is issued.
   */
  socket.on(EndpointNames.GET_SESSION_INFO, (data, callback) => {
    let { session } = user;

    if (!session) {
      // Check if user is admin of any session
      logger.debug(EndpointNames.GET_SESSION_INFO, "Checking if user", user.name, "is admin of any session");
      [ session ] = orchestrator.getAdministratedSessions(user);
    }

    if (!session) {
      logger.debug(EndpointNames.GET_SESSION_INFO, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    logger.debug(EndpointNames.GET_SESSION_INFO, "Getting info for session", session.name);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      session.serialize()
    ));
  });

  /**
   * Adds the current user to an existing session identified by the given
   * session ID. If the user is already in a session (including the given
   * session), an error is issued.
   */
  socket.on(EndpointNames.JOIN_SESSION, (data, callback) => {
    const { sessionId } = data;
    const session = orchestrator.getSession(sessionId);

    if (!session) {
      logger.warn(EndpointNames.JOIN_SESSION, "Session with ID", sessionId, "not found");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_FOUND));
    }

    // Check if user is already in any session
    if (user.session) {
      // Check if user is already in given session
      if (user.session.id == session.id) {
        logger.warn(EndpointNames.JOIN_SESSION, "User is already in session", session.id);
        return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_ALREADY_IN_SESSION));
      }

      logger.warn(EndpointNames.JOIN_SESSION, "User is already in another session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_ALREADY_IN_OTHER_SESSION));
    }

    logger.debug(EndpointNames.JOIN_SESSION, "Adding user", user.name, "to session", session.name);
    session.addUser(user);
    callback(util.createCommandResponse(data, ErrorCodes.OK, session.serialize()));
  });

  /**
   * Removes the user from their current session. If the user is not in an
   * session, an error is issued.
   */
  socket.on(EndpointNames.LEAVE_SESSION, (data, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.LEAVE_SESSION, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    logger.debug(EndpointNames.LEAVE_SESSION, "Removing user", user.name, "from session", session.name);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
    session.removeUser(user);
  });

  /**
   * Sends a given message to all users in the user's current session. This also
   * includes the sender itself. If the user not in any session, an error is
   * issued.
   */
  socket.on(EndpointNames.SEND_MESSAGE_TO_ALL, (data, callback) => {
    const { session } = user;
    const { message } = data;

    if (!session) {
      logger.warn(EndpointNames.SEND_MESSAGE_TO_ALL, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    logger.debug(EndpointNames.SEND_MESSAGE_TO_ALL, "Sending message to all in session", session.name, "from", user.name);
    session.sendMessageToAll(user, message);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  /**
   * Sends a given message from the current user to the user identified by the
   * given user ID. If the receiver is not in the same session or the sender is
   * not in any session, an error is issued.
   */
  socket.on(EndpointNames.SEND_MESSAGE, (data, callback) => {
    const { session } = user;
    const { message } = data;

    if (!session) {
      logger.warn(EndpointNames.SEND_MESSAGE, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    const receiver = session.getUser(data.userId);
    if (!receiver) {
      logger.warn(EndpointNames.SEND_MESSAGE, "Receiver with ID", data.userId, "is not in session", session.name);

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_SAME_SESSION
      ));
    }

    logger.debug(EndpointNames.SEND_MESSAGE, "Sending message from", user.name, "to", receiver.name, "in session", session.name);
    session.sendMessage(user, receiver, message);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });
};

export default installHandlers;
