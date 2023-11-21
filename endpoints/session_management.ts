import * as util from "../util";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";
import Session from "../app/session";

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

  socket.on(EndpointNames.ADD_SESSION, (data, callback) => {
    const {
      sessionName, sessionDescription,
      scenarioId, scenarioJson,
      sessionProtocol = "unknown"
    } = data;

    orchestrator.addScenario()

    const session = new Session(sessionName.trim(), sessionDescription, sessionProtocol);

    session.addUser(user);
    session.setAdministrator(user);
    orchestrator.addSession(session);
  });

  socket.on(EndpointNames.DELETE_SESSION, (data, callback) => {

  });

  socket.on(EndpointNames.GET_SESSIONS, (data, callback) => {

  });

  socket.on(EndpointNames.GET_SESSION_INFO, (data, callback) => {

  });

  socket.on(EndpointNames.JOIN_SESSION, (data, callback) => {

  });

  socket.on(EndpointNames.LEAVE_SESSION, (data, callback) => {

  });
};

export default installHandlers;
