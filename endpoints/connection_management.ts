import io from "socket.io";

import * as util from "../util";
import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";

const DEBUG = util.LogLevel.DEBUG;

/**
 * Installs a handler which responds to the `LOGIN` message and creates a new
 * user object. The handler returns a promise which, when resolved, contains a
 * new user object instantiated with the params received in the request.
 *
 * @param orchestrator Reference to the orchestrator
 * @param socket Reference to socket that received the connection
 * @returns A promise that resolves to a new user object, or rejects if the user could not be instantiated
 */
export const installLoginHandler =  async (orchestrator: Orchestrator, socket: io.Socket): Promise<User> => {
  return new Promise((resolve, reject) => {
    /**
     * Creates a new user with the given username which is stored in the
     * enclosing promise. If the received data contained no username, causes
     * the promise to reject.
     */
    socket.on(EndpointNames.LOGIN, (data, callback) => {
      const { userName }: { userName: string | undefined } = data;

      if (!userName) {
        callback(util.createResponse(ErrorCodes.MISSING_CREDENTIALS));

        util.log(DEBUG, "UserLogin: no username supplied");
        reject();
        return;
      }

      const user = orchestrator.findUser(userName) || new User(userName, socket);
      orchestrator.addUser(user);

      callback(util.createCommandResponse(data, ErrorCodes.OK, {
        userId: user.id
      }));

      resolve(user);
    });
  });
};

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  /**
   * Logs the user out from the orchestrator, removing them from their session
   * first.
   */
  socket.on(EndpointNames.LOGOUT, (data, callback) => {
    user.session?.removeUser(user);
    orchestrator.removeUser(user);

    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  /**
   * Handles a disconnct received from a socket by removing the associated user
   * from their session and the orchestrator.
   */
  socket.on("disconnect", () => {
    user.session?.removeUser(user);
    orchestrator.removeUser(user);
  });
};

export default installHandlers;
