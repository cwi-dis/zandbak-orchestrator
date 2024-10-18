const io = require("socket.io-client");

if (process.argv.length < 3) {
  const [ command, script ] = process.argv;
  console.log("USAGE:", command, script, "orchestrator_host");

  process.exit(1);
}

const [ , , host ] = process.argv;
const url = new URL("/log", "ws://" + host);
const socket = io(url.href);

socket.on("connect", () => {
  console.log("Connected to", url.href);
  console.log("Ready to receive log messages...");

  socket.on("message", ({ timestamp, level, message }) => {
    console.log(timestamp, `${level}:`, message);
  });

  socket.on("error", (err) => {
    console.log("Socket error:", err.message);
    process.exit(1);
  });
});

socket.on("connect_error", (err) => {
  console.log("Connection error:", err.message);
  process.exit(1);
});
