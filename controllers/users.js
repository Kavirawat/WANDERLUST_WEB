const User = require("../models/user.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ======================== SIGNUP ==========================
module.exports.renderSignUpForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

// ========================== LOGIN =========================
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// ========================== LOGOUT ========================
module.exports.logOut = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully");
    res.redirect("/listings");
  });
};
//===================== FORGOT PASSWORD =====================
module.exports.renderForgotForm = (req, res) => {
  res.render("users/forgot.ejs");
};

module.exports.sendResetMail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    req.flash("error", "No account with that email.");
    return res.redirect("/forgot");
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetURL = `http://localhost:8080/reset/${token}`;

  console.log("RESET URL =>", resetURL);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: "Password reset",
    html: `<p>Click the link below to reset your password:</p>
      <p><a href="${resetURL}">${resetURL}</a></p>`,
    text: `Reset your password: ${resetURL}`,
  });

  req.flash("success", "Reset link sent to your email.");
  res.redirect("/login");
};

// ===================== RESET FORM ==============================================
module.exports.renderResetForm = async (req, res) => {
  // const { token } = req.params;

  // const user = await User.findOne({
  //   resetPasswordToken: token,
  //   resetPasswordExpire: { $gt: Date.now() },
  // });

  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Token invalid or expired");
    return res.redirect("/forgot");
  }

  res.render("users/reset-password.ejs", { token });
};

// ===================== RESET FORM (GET) ===================
module.exports.renderResetForm = async (req, res) => {
  const { token } = req.params;
  // console.log("RESET ROUTE TOKEN:", token);

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Token invalid or expired");
    return res.redirect("/forgot");
  }

  res.render("users/reset-password.ejs", { token });
};

// ===================== RESET PASSWORD (POST) ==============
module.exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Token is invalid or expired.");
    return res.redirect("/forgot");
  }

  await user.setPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  req.flash("success", "Password reset successful. Please log in.");
  res.redirect("/login");
};

async function generateResetToken(userEmail) {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw new Error("No user found with that email.");

  // 1. Generate a plain-text random token to send to the user
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. Hash the token to store in the database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3. Save the hashed token and set an expiration (e.g., 1 hour)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms
  await user.save();

  // 4. Return the UNHASHED token to be sent in the email
  return resetToken;
}
