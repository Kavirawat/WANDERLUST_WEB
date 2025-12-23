const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isloggedIn, isOwner, validateListing } = require("../middleware.js");
const { authorize } = require("passport");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isloggedIn,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(listingController.createListing)
  );

//============================================ New Route =================================
router.get("/new", isloggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .delete(isloggedIn, isOwner, wrapAsync(listingController.destroyListing))
  .put(
    isloggedIn,
    isOwner,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(listingController.updateListing)
  )
  .get(wrapAsync(listingController.showListing));

//=========================================== Edit Route ===================================
router.get(
  "/:id/edit",
  isloggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
