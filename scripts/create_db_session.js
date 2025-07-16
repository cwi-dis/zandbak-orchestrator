const fs = require("fs");
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["scheduled", "ongoing", "completed"], default: "scheduled" },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  presentations: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      presenter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      slidesUrl: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

if (process.argv.length < 5) {
  const [ command, script ] = process.argv;
  console.log("USAGE:", command, script, "db_url user_id session_json");

  process.exit(1);
}

const [,, dbUrl, userId, sessionJson ] = process.argv;

mongoose.connect(dbUrl).then(() => {
  console.log("MongoDB connection established");

  const sessionData = JSON.parse(fs.readFileSync(sessionJson, "utf8"));

  sessionData.moderator = userId;
  sessionData.startTime = Date.now();
  sessionData.endTime = Date.now() + 3600;
  sessionData.presentations = sessionData.presentations.map((p) => {
    return { ...p, presenter: userId };
  });

  console.log("Creating new session with name", sessionData.title);

  Session.create(sessionData).then((s) => {
    console.log("Session created successfully! Session ID:", s._id);
    process.exit(0);
  }).catch((e) => {
    console.error("Could not create session:", e);
    process.exit(1);
  });
});
