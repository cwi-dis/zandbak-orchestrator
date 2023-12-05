import * as util from "../util";

import EndpointNames from "./endpoint_names";
import User from "../app/user";
import ErrorCodes  from "./error_codes";

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
      return callback(util.createResponse(
        ErrorCodes.SESSION_USER_NOT_IN_ANY_SESSION
      ));
    }

    if (!streamType) {
      return callback(util.createResponse(
        ErrorCodes.STREAM_DATA_MISSING_KIND
      ));
    }

    if (!streamDescription) {
      streamDescription = "";
    }

    user.declareDataStream(streamType, streamDescription);
    const { dataStreams, remoteDataStreams } = user.serialize();

    callback(util.createResponse(ErrorCodes.OK, {
      dataStreams, remoteDataStreams,
      connectionId: user.id,
      connectionLoggedAs: user.id
    }));
  });
};

export default installHandlers;
