const io = require("socket.io-client");
const util = require("util");

if (process.argv.length < 3) {
  const [ command, script ] = process.argv;
  console.log("USAGE:", command, script, "orchestrator_host");

  process.exit(1);
}

const [ , , host ] = process.argv;
const socket = io("ws://" + host);

socket.on("connect", () => {
  socket.emit("DumpData", {}, (res) => {
    const { body } = res;

    console.log(util.inspect(body, {
      showHidden: false,
      depth: null,
      colors: true
    }));

    process.exit(0);
  });
});
