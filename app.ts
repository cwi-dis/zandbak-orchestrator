import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

import { getFromEnvironment, logger, ORCHESTRATOR_VERSION } from "./util";
import Orchestrator from "./app/orchestrator";

import installConnectionHandlers, { installLoginHandler } from "./endpoints/connection_management";
import installSessionHandlers from "./endpoints/session_management";
import installUtilHandlers from "./endpoints/util";
import installUserDataHandlers from "./endpoints/user_data";
import installSceneEventHandlers from "./endpoints/scene_events";
import installStreamHandlers from "./endpoints/data_streams";

const [ PORT ] = getFromEnvironment("PORT");

logger.info("Launching orchestrator version", ORCHESTRATOR_VERSION);

/**
 * Create new orchestrator instance.
 **/
const orchestrator = new Orchestrator();

/**
 * Set up express app and create HTTP server.
 */
const app = express();
const server = createServer(app);

/**
 * Set up Socket.IO server with protocol version 2/3 backward-compatibility.
 **/
const io = new Server(server, { allowEIO3: true });

/**
 * Install handler functions once a new socket connects.
 **/
io.on("connection", async (socket) => {
  logger.debug("Client socket connected, awaiting login...");
  const user = await installLoginHandler(orchestrator, socket);

  logger.debug("Login process complete, installing event handlers");
  installConnectionHandlers(orchestrator, user);
  installSessionHandlers(orchestrator, user);
  installUserDataHandlers(orchestrator, user);
  installSceneEventHandlers(user);
  installStreamHandlers(user);
  installUtilHandlers(user);

  logger.debug("Event handlers installed");
});

/**
 * Launch server on port given by environment variable PORT
 */
server.listen(PORT, () => {
  logger.info("Socket.io server listening on port", PORT);
});
