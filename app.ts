import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

import { getFromEnvironment, installLogServerHandler, onUnhandled, ORCHESTRATOR_VERSION } from "./util";
import logger from "./logger";
import Orchestrator from "./app/orchestrator";

import installConnectionHandlers, { installLoginHandler } from "./endpoints/connection_management";
import installSessionHandlers from "./endpoints/session_management";
import installUtilHandlers from "./endpoints/util";
import installUserDataHandlers from "./endpoints/user_data";
import installSceneEventHandlers from "./endpoints/scene_events";
import installStreamHandlers from "./endpoints/data_streams";

const [ PORT ] = getFromEnvironment(["PORT"]);
const [ LOG_SERVER ] = getFromEnvironment(["LOG_SERVER"], null);

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
 * Set up Socket.IO server
 **/
const io = new Server(server);

// Install handler for forwarding log messages if LOG_SERVER variable is set
if (LOG_SERVER) {
  logger.info("Installing handlers for log server in namespace /log");
  installLogServerHandler(io);
}

/**
 * Install handler functions once a new socket connects.
 **/
io.on("connection", async (socket) => {
  // Install handler for unhandled messages
  onUnhandled(socket, (event, params) => {
    logger.error("Unhandled event", event, "received with params", params);
  });

  // Installing util handlers
  installUtilHandlers(orchestrator, socket);

  try {
    logger.debug("Client socket connected, awaiting login...");

    // Installing login handlers and waiting for login process to complete
    // before installing other handlers
    const user = await installLoginHandler(orchestrator, socket);

    logger.debug("Login process complete, installing event handlers");
    installConnectionHandlers(orchestrator, user);
    installSessionHandlers(orchestrator, user);
    installUserDataHandlers(orchestrator, user);
    installSceneEventHandlers(user);
    installStreamHandlers(user);

    logger.debug("Event handlers installed");
  } catch (err) {
    logger.error("Login process failed:", err);
  }
});

/**
 * Launch server on port given by environment variable PORT
 */
server.listen(PORT, () => {
  logger.info("Socket.io server listening on port", PORT);
});
