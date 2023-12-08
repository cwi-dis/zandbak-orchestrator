import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";

dotenv.config();

import { getFromEnvironment, logger } from "./util";
import Orchestrator from "./app/orchestrator";

import installConnectionHandlers, { installLoginHandler } from "./endpoints/connection_management";
import installSessionHandlers from "./endpoints/session_management";
import installUtilHandlers from "./endpoints/util";
import installUserDataHandlers from "./endpoints/user_data";
import installSceneEventHandlers from "./endpoints/scene_events";
import installStreamHandlers from "./endpoints/data_streams";

const [ LOG_FOLDER, LOG_SERVER_PORT, PORT ] = getFromEnvironment(
  "LOG_FOLDER", "LOG_SERVER_PORT", "PORT"
);

/**
 * Create new orchestrator instance.
 **/
const orchestrator = new Orchestrator();

/**
 * Set up Socket.IO server with protocol version 2/3 backward-compatibility.
 **/
const io = new Server({ allowEIO3: true });

/**
 * Install handler functions once a new socket connects.
 **/
io.on("connection", async (socket) => {
  logger.debug("Client socket connected, awaiting login...");
  socket.onAny((event) => {
    logger.warn("Got unhandled event", event);
  });
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

io.listen(parseInt(PORT));
logger.info("Socket.io server listening on port", PORT);

/**
 * Create Express application for log server and set up routing.
 **/
const staticHttpServer = express();

staticHttpServer.get("/", (req, res) => {
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({}));
});

staticHttpServer.use("/log", express.static(LOG_FOLDER));

staticHttpServer.listen(LOG_SERVER_PORT, () => {
  logger.info("Log server listening on port", LOG_SERVER_PORT);
});
