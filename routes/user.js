const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

//==================== signup ===========================
router
  .route("/signup")
  .get(userController.renderSignUpForm)
  .post(wrapAsync(userController.signUp));

//====================== login ============================
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

//===================== logout =============================
router.get("/logout", userController.logOut);

//===================== forgot password ====================
router
  .route("/forgot")
  .get(userController.renderForgotForm)
  .post(wrapAsync(userController.sendResetMail));

//====================== reset password ===================
router
  .route("/reset/:token")
  .get(wrapAsync(userController.renderResetForm))
  .post(wrapAsync(userController.resetPassword));

module.exports = router;
