const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String },
  bio: { type: String },
  role: { type: String, enum: ["presenter"], default: "presenter"},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  statics: {
    login: async function (username, password) {
      const user = await this.findOne({ username });

      if (!user) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return null;
      }

      return user;
    }
  }
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

const User = mongoose.model("User", userSchema);

if (process.argv.length < 5) {
  const [ command, script ] = process.argv;
  console.log("USAGE:", command, script, "db_url username password");

  process.exit(1);
}

const [,, dbUrl, username, password ] = process.argv;

mongoose.connect(dbUrl).then(() => {
  console.log("MongoDB connection established");
  console.log("Creating new user with username", username, "and password", password);

  User.create({ username, password }).then((u) => {
    console.log("User created successfully! User ID:", u._id);
    process.exit(0);
  }).catch((e) => {
    console.error("Could not create user:", e);
    process.exit(1);
  });
});
