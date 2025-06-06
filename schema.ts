import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String },
  bio: { type: String },
  role: { type: String, enum: ["presenter"], default: "presenter"},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre("save", async function (next) {
  this.updatedAt = new Date();

  if (!this.isModified("password")) {
    return next();
  }

  try {
    this.salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, this.salt);

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.validatePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.login = async function (username: string, password: string) {
  const user = await this.findOne({ username });

  if (!user) {
    return null;
  }

  const isValid = await user.validatePassword(password);

  if (!isValid) {
    return null;
  }

  return user;
};

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
