const io = require("socket.io-client");

if (process.argv.length < 3) {
  console.log("USAGE:", process.argv[0], process.argv[1], "orchestrator_host");
  process.exit(1);
}

const [ , , host ] = process.argv;
const url = new URL("/log", "ws://" + host);
const socket = io(url.href);

socket.on("connect", async () => {
  console.log("Connected to", url.href);
  console.log("Ready to receive log messages...");

  socket.on("message", ({ level, message, timestamp }) => {
    console.log(`${timestamp} ${level}:`, message);
  });
});
