const io = require("socket.io-client");

if (process.argv.length < 3) {
  const [ command, script ] = process.argv;
  console.log("USAGE:", command, script, "orchestrator_host");

  process.exit(1);
}

const [ , , host ] = process.argv;
const socket = io("ws://" + host);

socket.on("connect", () => {
  socket.emit("TerminateOrchestrator", () => {
    process.exit(0);
  });
});
