import { io } from "socket.io-client";

const socket = io("ws://localhost:8090");

socket.on("connect", async () => {
  console.log("connected!");

  await socket.emit("Login", { userName: "test" }, (res: any) => {
    console.log(res);
  });

  await socket.emit("GetUserData", { userId: "666" }, (res: any) => {
    console.log("User data:", res);
  });

  await socket.emit("GetOrchestratorVersion", {}, (res: any) => {
    console.log("Orchestrator version:", res);
  });

  await socket.emit("GetNTPTime", {}, (res: any) => {
    console.log("Orchestrator version:", res);
  });
});
