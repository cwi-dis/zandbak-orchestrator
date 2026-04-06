const fs = require("fs");
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  model: { type: String },
});

const Room = mongoose.model("Room", roomSchema);

if (process.argv.length < 4) {
  const [ command, script ] = process.argv;
  console.log("USAGE:", command, script, "db_url room_json");

  process.exit(1);
}

const [,, dbUrl, roomJson ] = process.argv;

mongoose.connect(dbUrl).then(() => {
  console.log("MongoDB connection established");

  const roomData = JSON.parse(fs.readFileSync(roomJson, "utf8"));

  console.log("Creating new room with name", roomData.name);

  Room.create(roomData).then((r) => {
    console.log("Room created successfully! Room ID:", r._id);
    process.exit(0);
  }).catch((e) => {
    console.error("Could not create room:", e);
    process.exit(1);
  });
});
