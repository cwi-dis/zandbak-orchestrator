import * as util from "../util";

import EndpointNames from "./endpoint_names";
import Orchestrator from "../app/orchestrator";
import User from "../app/user";
import ErrorCodes  from "./error_codes";
import Session from "../app/session";
import Scenario from "app/scenario";

const installHandlers = (orchestrator: Orchestrator, user: User) => {
  const { socket } = user;

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

    callback(util.createCommandResponse(data, ErrorCodes.OK));
  });

  socket.on(EndpointNames.DELETE_SESSION, () => {

  });

  socket.on(EndpointNames.GET_SESSIONS, () => {

  });

  socket.on(EndpointNames.GET_SESSION_INFO, () => {

  });

  socket.on(EndpointNames.JOIN_SESSION, () => {

  });

  socket.on(EndpointNames.LEAVE_SESSION, () => {

  });
};

export default installHandlers;
