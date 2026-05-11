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
  try {
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

    const resetURL = `${req.protocol}://${req.get("host")}/reset/${token}`;

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Wanderlust - Password Reset",
      html: `<p>Click the link below to reset your password:</p>
                   <p><a href="${resetURL}">${resetURL}</a></p>`,
      text: `Reset your password: ${resetURL}`,
    });

    req.flash("success", "Reset link sent to your email.");
    res.redirect("/login");
  } catch (err) {
    console.error("ERROR IN SENDING MAIL:", err);
    req.flash("error", "Something went wrong. Please try again later.");
    res.redirect("/forgot");
  }
};

// ===================== RESET FORM (GET) ===================
module.exports.renderResetForm = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Token invalid or expired");
    return res.redirect("/forgot");
  }
  res.render("users/reset-password.ejs", { token });
};

// ===================== RESET PASSWORD (POST) ==============
module.exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Token is invalid or expired.");
      return res.redirect("/forgot");
    }

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash("success", "Password reset successful. Please log in.");
    res.redirect("/login");
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/forgot");
  }
};
