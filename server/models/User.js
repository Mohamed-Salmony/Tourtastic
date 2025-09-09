const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  username: {
    type: String,
    required: [true, "Please add a username"],
    unique: true,
    minlength: [3, "Username must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false, // Don't return password by default
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-]{10,}$/, "Please add a valid phone number"],
  },
  address: {
    type: String,
  },
  birthdate: {
    type: Date,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  wishlist: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  // Password reset via email OTP
  resetPasswordCodeHash: {
    type: String,
    select: false,
  },
  resetPasswordCodeExpires: {
    type: Date,
  },
  resetPasswordVerified: {
    type: Boolean,
    default: false,
  },
}, { versionKey: false }); // Disable version key

// Encrypt password using bcrypt before saving
UserSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (err) {
    // In case of an error, do not authenticate
    return false;
  }
};

module.exports = mongoose.model("User", UserSchema);
