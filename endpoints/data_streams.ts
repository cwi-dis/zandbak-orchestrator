import * as util from "../util";
import logger from "../logger";

import EndpointNames from "./endpoint_names";
import ErrorCodes  from "./error_codes";
import User from "../app/user";

const installHandlers = (user: User) => {
  const { socket } = user;

  /**
   * Declares a new data stream for the current user by taking stream type and
   * description as parameters. Returns a serialised list of connection
   * information and declared data streams.
   */
  socket.on(EndpointNames.DECLARE_DATA_STREAM, (streamType, streamDescription, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.DECLARE_DATA_STREAM, "User", user.name, "not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!streamType) {
      logger.warn(EndpointNames.DECLARE_DATA_STREAM, "Stream type not specified");

      return callback?.(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_KIND
      ));
    }

    if (!streamDescription) {
      streamDescription = "";
    }

    user.declareDataStream(streamType, streamDescription);
    const { dataStreams, remoteDataStreams } = user;

    logger.debug(EndpointNames.DECLARE_DATA_STREAM, "Data stream", streamType, "declared for", user.name);

    callback?.(util.createResponse(ErrorCodes.OK, {
      dataStreams, remoteDataStreams,
      connectionId: user.id,
      connectionLoggedAs: user.id
    }));
  });

  /**
   * Removes a data stream for the current user by taking stream type as
   * parameter. Returns a serialised list of connection information and
   * declared data streams after the removal operation
   */
  socket.on(EndpointNames.REMOVE_DATA_STREAM, (streamType, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.REMOVE_DATA_STREAM, "User", user.name, "not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!streamType) {
      logger.warn(EndpointNames.REMOVE_DATA_STREAM, "Stream type not specified");

      return callback?.(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_KIND
      ));
    }

    user.removeDataStream(streamType);
    const { dataStreams, remoteDataStreams } = user;

    logger.debug(EndpointNames.REMOVE_DATA_STREAM, "Data stream", streamType, "removed for", user.name);

    callback?.(util.createResponse(ErrorCodes.OK, {
      dataStreams, remoteDataStreams,
      connectionId: user.id,
      connectionLoggedAs: user.id
    }));
  });

  /**
   * Registers the current user for a data stream from the user with the given
   * ID and the given stream type.
   */
  socket.on(EndpointNames.REGISTER_FOR_DATA_STREAM, (fromUserId, streamType, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.REGISTER_FOR_DATA_STREAM, "User", user.name, "not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!fromUserId) {
      logger.warn(EndpointNames.REGISTER_FOR_DATA_STREAM, "No sending user specified");

      return callback?.(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_USER_NOT_PROVIDED
      ));
    }

    const fromUser = session.getUser(fromUserId);
    if (!fromUser) {
      logger.warn(EndpointNames.REGISTER_FOR_DATA_STREAM, "Sending user", fromUserId, "not found");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_SESSION
      ));
    }

    if (!streamType) {
      logger.warn(EndpointNames.REGISTER_FOR_DATA_STREAM, "Stream type not specified");

      return callback?.(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_KIND
      ));
    }

    user.subscribeToDataStream(fromUser, streamType);
    const { dataStreams, remoteDataStreams } = user;

    logger.debug(EndpointNames.REGISTER_FOR_DATA_STREAM, "Subscribing", user.name, "for stream", streamType, "from", fromUser.name);

    callback?.(util.createResponse(ErrorCodes.OK, {
      dataStreams, remoteDataStreams,
      connectionId: user.id,
      connectionLoggedAs: user.id
    }));
  });

  /**
   * Unregisters the current user from a remote data stream from the user with
   * the given ID and the given stream type.
   */
  socket.on(EndpointNames.UNREGISTER_FROM_DATA_STREAM, (fromUserId, streamType, callback) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.UNREGISTER_FROM_DATA_STREAM, "User", user.name, "not in any session");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!fromUserId) {
      logger.warn(EndpointNames.UNREGISTER_FROM_DATA_STREAM, "No sending user specified");

      return callback?.(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_USER_NOT_PROVIDED
      ));
    }

    const fromUser = session.getUser(fromUserId);
    if (!fromUser) {
      logger.warn(EndpointNames.UNREGISTER_FROM_DATA_STREAM, "Sending user", fromUserId, "not found");

      return callback?.(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_SESSION
      ));
    }

    if (!streamType) {
      logger.warn(EndpointNames.UNREGISTER_FROM_DATA_STREAM, "Stream type not specified");

      return callback?.(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_KIND
      ));
    }

    user.removeStreamSubscription(fromUser, streamType);
    const { dataStreams, remoteDataStreams } = user;

    logger.debug(EndpointNames.REGISTER_FOR_DATA_STREAM, "Unsubscribing", user.name, "from stream", streamType, "from", fromUser.name);

    callback?.(util.createResponse(ErrorCodes.OK, {
      dataStreams, remoteDataStreams,
      connectionId: user.id,
      connectionLoggedAs: user.id
    }));
  });

  /**
   * Sends data from the current user to all users in the same session,
   * provided they are registered for the given stream type. If either the
   * stream type of the data are not provided, nothing happens.
   */
  socket.on(EndpointNames.SEND_DATA, (streamType, data) => {
    const { session } = user;

    if (!session) {
      logger.warn(EndpointNames.SEND_DATA, "User is not in any session");
      return;
    }if (!streamType || !data) {
      logger.warn(EndpointNames.SEND_DATA, "Missing parameter streamType or data");
      return;
    }

    logger.silly(EndpointNames.SEND_DATA, "Sending data with stream type", streamType);
    session.sendData(user, streamType, data);
  });
};

export default installHandlers;
