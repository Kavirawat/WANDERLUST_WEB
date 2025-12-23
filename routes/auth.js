// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const PasswordResetToken = require("../models/PasswordResetToken");
// const sendEmail = require("../utils/sendEmail"); // e.g. using nodemailer

const router = express.Router();

router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // delete old token if exists
    await PasswordResetToken.deleteMany({ userId: user._id });

    // generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // hash token before storing
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    // await sendEmail(user.email, "Password reset", Click: ${resetUrl});
    res.json({ message: "Password reset link sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// routes/auth.js (add below previous route)
router.post("/reset-password", async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;

    const resetDoc = await PasswordResetToken.findOne({ userId });
    if (!resetDoc)
      return res.status(400).json({ message: "Invalid or expired token" });

    const isValid = await bcrypt.compare(token, resetDoc.token);
    if (!isValid)
      return res.status(400).json({ message: "Invalid or expired token" });

    // update user password
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // delete used token
    await PasswordResetToken.deleteMany({ userId });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
