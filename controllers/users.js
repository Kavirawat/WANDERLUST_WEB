const User = require("../models/user.js");
const crypto = require("crypto");
// const nodemailer = require("nodemailer");

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

const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;

//================== API Key configure karein =================
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.EMAIL_PASS;

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
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetURL = `${req.protocol}://${req.get("host")}/reset/${token}`;

    // Brevo API instance
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Wanderlust - Password Reset";
    sendSmtpEmail.htmlContent = `<p>Click here to reset: <a href="${resetURL}">${resetURL}</a></p>`;
    sendSmtpEmail.sender = {
      name: "Wanderlust",
      email: "kavirrawat896@gmail.com",
    }; 
    
    //=============== verified sender email =====================
    sendSmtpEmail.to = [{ email: user.email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    req.flash("success", "Reset link sent to your email.");
    res.redirect("/login");
  } catch (err) {
    console.error("BREVO API ERROR:", err);
    req.flash(
      "error",
      "Failed to send email. Please check your Brevo settings.",
    );
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
