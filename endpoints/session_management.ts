import * as util from "../util";
import logger from "../logger";

import { Session as SessionModel } from "../schema";
import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";
import Session from "../app/session";
import Presentation from "../app/presentation";

const [ EXTERNAL_HOSTNAME ] = util.getFromEnvironment(["EXTERNAL_HOSTNAME"], null);

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  /**
   * Endpoint invoked for the user to create a new session with the given data.
   * Returns a serialised version of the session to the caller upon success.
   */
  socket.on(EndpointNames.ADD_SESSION, (data, callback) => {
    const {
      sessionName, sessionDescription, sessionProtocol = "unknown",
      channels = []
    } = data;

    logger.debug(EndpointNames.ADD_SESSION, "Creating new session with name", sessionName);

    try {
      let externalHostname = EXTERNAL_HOSTNAME;

      if (!externalHostname || externalHostname == "dynamic") {
        logger.debug(EndpointNames.ADD_SESSION, "Trying to determine external hostname from request headers");
        externalHostname = util.getExternalHostname(socket);
        logger.debug(EndpointNames.ADD_SESSION, "External hostname:", externalHostname);
      }

      const session = new Session(
        sessionName.trim(),
        sessionDescription,
        sessionProtocol,
        channels,
        orchestrator.transportManager,
        externalHostname
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
      logger.error(EndpointNames.ADD_SESSION, "Error during session creation:", err.stack);

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_ADD_FAILED
      ));
    }
  });

  /**
   * Schedules a session from a session defined in the database by passing the
   * session ID as parameter. The creating user is added as an administrator to
   * the session. If no session with the given ID exists, an error is returned.
   */
  socket.on(EndpointNames.SCHEDULE_SESSION, async (data, callback) => {
    const { sessionId } = data;

    logger.debug(EndpointNames.SCHEDULE_SESSION, "Searching for session", sessionId);
    const dbSession = await SessionModel.findById(sessionId);

    if (!dbSession) {
      logger.warn(EndpointNames.SCHEDULE_SESSION, "Session with ID", sessionId, "not found");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_NOT_FOUND));
    }

    let externalHostname = EXTERNAL_HOSTNAME;

    if (!externalHostname || externalHostname == "dynamic") {
      logger.debug(EndpointNames.SCHEDULE_SESSION, "Trying to determine external hostname from request headers");
      externalHostname = util.getExternalHostname(socket);
      logger.debug(EndpointNames.SCHEDULE_SESSION, "External hostname:", externalHostname);
    }

    const session = new Session(
      dbSession.title,
      dbSession.description,
      "socketio",
      ["transform"],
      orchestrator.transportManager,
      externalHostname
    );

    session.status = "ongoing";
    session.schedule = dbSession.presentations.map((p) => {
      return new Presentation(
        p.title,
        p.description,
        p.presenter._id.toString(),
        p.slidesUrl,
        p.numSlides
      );
    });

    logger.debug(EndpointNames.SCHEDULE_SESSION, "Adding user", user.name, "as admin to new scheduled session", session.name);

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
    const { sessionId, override = false }: { sessionId: string, override: boolean } = data;
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

    if (session.persistent && !override) {
      logger.warn(EndpointNames.DELETE_SESSION, "Session", session.name, "is persistent");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_DELETE_UNAUTHORIZED));
    }

    logger.debug(EndpointNames.DELETE_SESSION, "Deleting session", session.name);

    orchestrator.removeSession(session, override);
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
   * Returns a list of scheduled sessions from the database, provided their
   * status has not been set to `completed` yet. Only users of type `presenter`
   * are allowed to call this endpoint. All other users will receive an error
   * response.
   */
  socket.on(EndpointNames.GET_SCHEDULED_SESSIONS, async (data, callback) => {
    logger.debug(EndpointNames.GET_SCHEDULED_SESSIONS, "Getting scheduled sessions");

    if (user.userType !== "presenter") {
      logger.warn(EndpointNames.GET_SCHEDULED_SESSIONS, "User", user.name, "is not allowed to get scheduled sessions");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED
      ));
    }

    const dbSessions = await SessionModel.find({
      status: { $ne: "completed" }
    }, {
      __v: 0
    });

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      dbSessions
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
   * Returns a serialised version of the last 100 messages in the user's
   * current session. If the user is not in any session, an error is issued.
   */
  socket.on(EndpointNames.GET_MESSAGES, (data, callback) => {
    const { count }: { count: util.Optional<number> } = data;
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.GET_MESSAGES, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    logger.debug(EndpointNames.GET_MESSAGES, "Getting messages for session", session.name);
    callback(util.createCommandResponse(data, ErrorCodes.OK, session.getMessages(count)));
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

  /**
   * Sets the status of the user's current session to the given status. If the
   * user is not in any session, an error is issued. Only presenters or the
   * session administrator are allowed to set the session status.
   */
  socket.on(EndpointNames.SET_SESSION_STATUS, (data, callback) => {
    const { session } = user;
    const { status } = data;

    if (!session) {
      logger.warn(EndpointNames.SET_SESSION_STATUS, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (user.userType !== "presenter" && !session.isMaster(user)) {
      logger.warn(EndpointNames.SET_SESSION_STATUS, "User", user.name, "is not allowed to set session status");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED
      ));
    }

    logger.debug(EndpointNames.SET_SESSION_STATUS, "Setting session status for", session.name, "to", status);
    session.status = status;

    callback(util.createCommandResponse(data, ErrorCodes.OK, {
      sessionId: session.id,
      sessionStatus: session.status
    }));
  });

  /**
   * Sets the current presentation for the user's current session. If the user
   * is not in any session, an error is issued. Only presenters or the session
   * administrator are allowed to set the current presentation.
   */
  socket.on(EndpointNames.SET_SESSION_PRESENTATION, (data, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.SET_SESSION_PRESENTATION, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (user.userType !== "presenter" && !session.isMaster(user)) {
      logger.warn(EndpointNames.SET_SESSION_PRESENTATION, "User", user.name, "is not allowed to set session presentation");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED
      ));
    }

    const currentPresentation = session.gotoNextPresentation();

    logger.debug(EndpointNames.SET_SESSION_PRESENTATION, "Setting current presentation for session", session.name, "to", currentPresentation?.name);
    callback(util.createCommandResponse(data, ErrorCodes.OK, {
      sessionId: session.id,
      sessionCurrentPresentation: currentPresentation?.serialize() || null
    }));
  });

  /**
   * Changes the current presentation slide for the user's current session.
   * If the user is not in any session, an error is issued. Only presenters or
   * the session administrator are allowed to change the current presentation
   * slide.
   * The endpoint accepts a `slideOffset` parameter which is added to the
   * current slide index to determine the new slide index. If the offset is
   * negative, the slide index is decreased, if it is positive, the slide index
   * is increased.
   */
  socket.on(EndpointNames.CHANGE_SLIDE, (data, callback) => {
    const { session } = user;
    const { slideOffset = 0 }: { slideOffset: number } = data;

    if (!session) {
      logger.warn(EndpointNames.CHANGE_SLIDE, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (user.userType !== "presenter" && !session.isMaster(user)) {
      logger.warn(EndpointNames.CHANGE_SLIDE, "User", user.name, "is not allowed to set session presentation");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED
      ));
    }

    session.changeSlide(slideOffset);

    logger.debug(EndpointNames.CHANGE_SLIDE, "Setting current presentation slide for session", session.name, "to", session.currentPresentation?.currentSlide);
    callback(util.createCommandResponse(data, ErrorCodes.OK, {
      sessionId: session.id,
      sessionCurrentPresentation: session.currentPresentation?.serialize() || null
    }));
  });

  /**
   * Sets the isSharing flag of the current presentation to the boolean value
   * given in the parameters. Only presenters and session admins are allowed to
   * preform this action.
   */
  socket.on(EndpointNames.IS_SHARING, (data, callback) => {
    const { session } = user;
    const { isSharing }: { isSharing: boolean } = data;

    if (isSharing == undefined) {
      logger.warn(EndpointNames.IS_SHARING, "isSharing parameter is not set");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_IS_SPEAKING_FLAG_NOT_SET
      ));
    }

    if (!session) {
      logger.warn(EndpointNames.IS_SHARING, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!(session.isMaster(user) || user.userType == "presenter")) {
      logger.warn(EndpointNames.IS_SHARING, "User with ID", user.id, "is not authorized to set sharing static for current presentation");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED
      ));
    }

    if (!session.setPresentationIsSharing(isSharing)) {
      logger.warn(EndpointNames.IS_SHARING, "Could not set isSharing flag for current presentation");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_IS_SHARING_FLAG_NOT_SET
      ));
    }

    const { currentPresentation } = session;
    logger.debug(EndpointNames.IS_SHARING, "Set isSharing flag for current presentation to", currentPresentation?.isSharing);

    callback(util.createCommandResponse(data, ErrorCodes.OK, {
      sessionId: session.id,
      sessionCurrentPresentation: currentPresentation?.serialize()
    }));
  });

  /**
   * Sets the raised hand status for the current user in the user's current session.
   * If the user is not in any session, an error is issued.
   */
  socket.on(EndpointNames.RAISE_HAND, (data, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.RAISE_HAND, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    logger.debug(EndpointNames.RAISE_HAND, "Raising hand for user", user.name, "in session", session.name);
    session.raiseHand(user);
    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  /**
   * Clears the raised hand status for the user identified by the given user ID
   * in the user's current session. A user can clear their own raised hand, or
   * if the user is the session administrator, clear the raised hand for
   * any other user in the session. If the user is not in any session, an error
   * is issued.
   */
  socket.on(EndpointNames.CLEAR_RAISED_HAND, (data, callback) => {
    const { userId }: { userId: util.Optional<string> } = data;
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.CLEAR_RAISED_HAND, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    const userToClear = session.getUser(userId || user.id);

    if (!userToClear) {
      logger.warn(EndpointNames.CLEAR_RAISED_HAND, "User with ID", userId, "is not in session", session.name);

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_SAME_SESSION
      ));
    }

    logger.debug(EndpointNames.CLEAR_RAISED_HAND, "Clearing raised hand for user", user.name, "in session", session.name);

    if (userToClear == user || session.isMaster(user) || user.userType == "presenter") {
      session.clearRaisedHand(userToClear);
      callback(util.createCommandResponse(data, ErrorCodes.OK));
    } else {
      logger.warn(EndpointNames.CLEAR_RAISED_HAND, "User with ID", userId, "is not authorized to clear raised hand for user", user.name);

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED
      ));
    }
  });

  /**
   * Returns a list of all users with their raised hand status in the user's
   * current session. If the user is not in any session, an error is issued.
   */
  socket.on(EndpointNames.GET_RAISED_HANDS, (data, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.GET_RAISED_HANDS, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    logger.debug(EndpointNames.GET_RAISED_HANDS, "Getting raised hands for session", session.name);
    callback(util.createCommandResponse(data, ErrorCodes.OK, session.getRaisedHands()));
  });

  /**
   * Sets the isSpeaking flag of the current user to the boolean value given in
   * the parameters.
   */
  socket.on(EndpointNames.IS_SPEAKING, (data, callback) => {
    const { session } = user;
    const { isSpeaking }: { isSpeaking: boolean } = data;

    if (isSpeaking == undefined) {
      logger.warn(EndpointNames.IS_SPEAKING, "isSpeaking parameter is not set");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_IS_SPEAKING_FLAG_NOT_SET
      ));
    }

    if (!session) {
      logger.warn(EndpointNames.IS_SPEAKING, "User", user.name, "is not in any session");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!session.setSpeakingUser(user, isSpeaking)) {
      logger.warn(EndpointNames.IS_SPEAKING, "Could not set isSpeaking flag for current user");

      return callback(util.createCommandResponse(
        data,
        ErrorCodes.SESSION_IS_SPEAKING_FLAG_NOT_SET
      ));
    }

    logger.debug(EndpointNames.IS_SPEAKING, "Set isSpeaking flag for", user.name, "to", user.isSpeaking);
    callback(util.createCommandResponse(data, ErrorCodes.OK, { isSpeaking }));
  });
};

export default installHandlers;
