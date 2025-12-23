const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Recommended for reset lookups
    lowercase: true,
  },
  resetPasswordToken: {
    type: String,
    default: null,
    index: true, // Faster lookup when user clicks the reset link
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
