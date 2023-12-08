import { io } from "socket.io-client";

const socket = io("ws://localhost:8090");

socket.on("connect", () => {
  console.log("connected!");
});
