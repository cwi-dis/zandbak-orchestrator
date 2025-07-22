const io = require("socket.io-client");

// const socket = io("http://localhost:8090");
const socket = io("http://160.40.53.32:8090");
// const socket = io("http://160.40.53.32:8090");
// const socket = io("http://192.168.37.241:8090");
// const socket = io("http://192.16.197.145:8090");

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function randomNumber() {
  return Math.floor(Math.random() * 100).toString().padStart(3, "0");
}

socket.on("connect", async () => {
  console.log("Connected!");
  const userName = "test-" + randomNumber();

  const user = await socket.emitWithAck("Login", { userName });
  console.log("Login successful:", user);

  const result = await socket.emitWithAck("GetOrchestratorVersion", {});
  console.log(result);

  const session = await socket.emitWithAck("AddSession", {
    sessionName: "test-session",
    sessionDescription: "",
    sessionProtocol: "socketio",
    channels: ["transform"]
  });
  console.log(session);

  // const sessions = await socket.emitWithAck("GetSessions", {});

  // await socket.emitWithAck("JoinSession", { sessionId: Object.values(sessions.body)[0].sessionId });

  // await delay(2000);
  // console.log("1");
  // await socket.emitWithAck("SendMessageToAll", { message: "Hello World" });

  // await delay(2000);
  // console.log("2");
  // await socket.emitWithAck("SendMessageToAll", { message: "Hello Wieland" });

  // await delay(2000);
  // console.log("4");
  // await socket.emitWithAck("RaiseHand", {});

  // await delay(2000);
  // console.log("5");
  // await socket.emitWithAck("ClearRaisedHand", {});

  // await delay(2000);
  // console.log("3");
  // await socket.emitWithAck("SendMessageToAll", { message: "Bye!" });

  // await delay(2000);
  // await socket.emitWithAck("LeaveSession", {});

  process.exit(0);
});
