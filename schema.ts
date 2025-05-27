import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  bio: { type: String },
  role: { type: String, enum: ["presenter"], default: "presenter"},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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

export const User = mongoose.model("User", userSchema);
export const Session = mongoose.model("Session", sessionSchema);
