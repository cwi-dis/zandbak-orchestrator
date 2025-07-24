import io from "socket.io";

import { User as UserModel} from "../schema";
import { Optional, createCommandResponse, createResponse, DeviceType } from "../util";
import logger from "../logger";
import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User, { Presenter } from "../app/user";
import ErrorCodes  from "./error_codes";

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
    socket.on(EndpointNames.LOGIN, async (data, callback) => {
      const { userName, password, deviceType, id }: { userName: Optional<string>, password: Optional<string>, deviceType: Optional<DeviceType>, id: Optional<string> } = data;
      logger.debug(EndpointNames.LOGIN, "Starting login process with username", userName);

      if (!userName) {
        callback(createResponse(ErrorCodes.MISSING_CREDENTIALS));

        logger.warn(EndpointNames.LOGIN, "No username supplied");
        reject("No username supplied");

        return;
      }

      // User supplied a password, try to authenticate with the database
      if (password) {
        logger.debug(EndpointNames.LOGIN, "Password supplied, trying database authentication");

        const account = await UserModel.login(userName, password);

        if (!account) {
          callback(createResponse(ErrorCodes.INVALID_CREDENTIALS));

          logger.warn(EndpointNames.LOGIN, "Invalid credentials for user", userName);
          reject("Invalid credentials");

          return;
        }

        logger.debug(EndpointNames.LOGIN, "User", userName, "authenticated with database");
        const user = new Presenter(userName, socket, deviceType || "unknown", account._id.toString());
        orchestrator.addUser(user);

        resolve(user);

        return callback(createCommandResponse(data, ErrorCodes.OK, {
          userId: user.id,
          userData: user.serialize()
        }));
      }

      // Check if a user with the given username already exists in the orchestrator
      if (orchestrator.findUser(userName)) {
        callback(createResponse(ErrorCodes.USER_EXISTS));

        logger.warn(EndpointNames.LOGIN, "A user with the username", userName, "is already logged in");
        reject("A user with the same username is already logged in");

        return;
      }

      // Create a new user without database authentication
      const user = new User(userName, socket, deviceType || "unknown", id);
      orchestrator.addUser(user);

      logger.debug(EndpointNames.LOGIN, "Added user", user.name, "to orchestrator");
      resolve(user);

      callback(createCommandResponse(data, ErrorCodes.OK, {
        userId: user.id,
        userData: user.serialize()
      }));
    });
  });
};

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  /**
   * Cleans up the session by removing the user from it. If the leaving user
   * also was the admin of the session, the session itself is deleted. The
   * function returns true if the session was deleted in addition to removing
   * the user from it or false if the session itself was not removed.
   *
   * @returns True if the session was also deleted
   */
  const cleanUpActiveSession = () => {
    const { session } = user;
    session?.removeUser(user);

    if (session?.administrator.id == user.id) {
      session.closeSession();
      orchestrator.removeSession(session);

      return true;
    }

    return false;
  };

  /**
   * Gets all sessions that the given user is administrator of and forcibly
   * closes them. This serves the purpose of cleaning up dangling sessions.
   *
   * @returns Number of sessions closed
   */
  const cleanUpDanglingSessions = () => {
    const administratedSessions = orchestrator.getAdministratedSessions(user);

    administratedSessions.forEach((s) => {
      s.closeSession();
      orchestrator.removeSession(s);
    });

    return administratedSessions.length;
  };

  /**
   * Logs the user out from the orchestrator, removing them from their session
   * first.
   */
  socket.on(EndpointNames.LOGOUT, (data, callback) => {
    logger.debug(EndpointNames.LOGOUT, "Logged out user", user.name);

    if (cleanUpActiveSession()) {
      logger.debug(EndpointNames.LOGOUT, "User was admin, closing session");
    }

    const numSessionsCleaned = cleanUpDanglingSessions();
    logger.debug(EndpointNames.LOGOUT, `Destroyed ${numSessionsCleaned} dangling sessions`);

    orchestrator.removeUser(user);
    callback?.(createCommandResponse(data, ErrorCodes.OK));
  });

  /**
   * Handles a disconnect received from a socket by removing the associated user
   * from their session and the orchestrator.
   */
  socket.on("disconnect", (reason) => {
    logger.debug("[DISCONNECT] Disconnected user", user.name, "reason:", reason);

    if (cleanUpActiveSession()) {
      logger.debug("[DISCONNECT] User was admin, closing session");
    }

    const numSessionsCleaned = cleanUpDanglingSessions();
    logger.debug(EndpointNames.LOGOUT, `Destroyed ${numSessionsCleaned} dangling sessions`);

    orchestrator.removeUser(user);
  });
};

export default installHandlers;
