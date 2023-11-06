import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";

dotenv.config();

import { getFromEnvironment } from "./util";

const [ LOG_FOLDER, LOG_SERVER_PORT, PORT ] = getFromEnvironment(
  "LOG_FOLDER", "LOG_SERVER_PORT", "PORT"
);

const io = new Server();
io.listen(parseInt(PORT));
console.log("Socket.io server listening on port", PORT);

const staticHttpServer = express();

staticHttpServer.get("/", (req, res) => {
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({}));
});

staticHttpServer.use("/log", express.static(LOG_FOLDER));

staticHttpServer.listen(LOG_SERVER_PORT, () => {
  console.log("Log server listening on port", LOG_SERVER_PORT);
});
