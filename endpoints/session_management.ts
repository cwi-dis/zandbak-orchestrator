import * as util from "../util";

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

    const session = new Session(
      sessionName.trim(),
      sessionDescription,
      sessionProtocol,
      new Scenario(scenarioId, scenarioName, scenarioDescription)
    );

    session.addUser(user);
    session.setAdministrator(user);
    orchestrator.addSession(session);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      session.serialize()
    ));
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
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_FOUND));
    }

    const { administrator } = session;
    if (administrator.id != user.id) {
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_DELETE_UNAUTHORIZED));
    }

    if (!session.isEmpty()) {
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_EMPTY));
    }

    orchestrator.removeSession(session);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  /**
   * Returns a serialised object of active sessions to the caller indexed by
   * session ID.
   */
  socket.on(EndpointNames.GET_SESSIONS, (data, callback) => {
    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      orchestrator.sessions
    ));
  });

  /**
   * Returns a serialised version of the user's current session. If the user
   * is not in any session, an error is issued.
   */
  socket.on(EndpointNames.GET_SESSION_INFO, (data, callback) => {
    const { session } = user;

    if (!session) {
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

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
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_FOUND));
    }

    // Check if user is already in any session
    if (user.session) {
      // Check if user is already in given session
      if (user.session.id == session.id) {
        return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_ALREADY_IN_SESSION));
      }

      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_ALREADY_IN_OTHER_SESSION));
    }

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
      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

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
      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

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
      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    const receiver = session.getUser(data.userId);
    if (!receiver) {
      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_SAME_SESSION
      ));
    }

    session.sendMessage(user, receiver, message);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });
};

export default installHandlers;
