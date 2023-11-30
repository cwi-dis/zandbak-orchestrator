import io from "socket.io";

import * as util from "../util";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";

export const installLoginHandler =  async (orchestrator: Orchestrator, socket: io.Socket): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Handle user login
    socket.on(EndpointNames.LOGIN, (data, callback) => {
      const { userName }: { userName: string | undefined } = data;

      if (!userName) {
        callback(util.createResponse(ErrorCodes.MISSING_CREDENTIALS));

        util.log("debug", "UserLogin: no username supplied");
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

  // Handle user logout
  socket.on(EndpointNames.LOGOUT, (data, callback) => {
    user.session?.removeUser(user);
    orchestrator.removeUser(user);

    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    user.session?.removeUser(user);
    orchestrator.removeUser(user);
  });
};

export default installHandlers;
