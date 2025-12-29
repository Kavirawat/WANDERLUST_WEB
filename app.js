if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const MongoStore = require("connect-mongo");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const Listing = require("./models/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");

// console.log("APP FILE LOADED");

// ================== DB URL ==================
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
// console.log("DB URL =>", dbUrl);

// ================== connect mongoose =========
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("DB connection error:", err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

// ================== VIEW ENGINE & MIDDLEWARE ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));
app.use(express.static("public"));

// ================== SESSION STORE ==================
const store = MongoStore.create({
  mongoUrl: dbUrl,
  collectionName: "sessions",
});

store.on("error", (err) => {
  console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionConfig = {
  store,
  secret: process.env.SESSION_SECRET || "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// ================== PASSPORT ==================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ================== LOCALS Middlewares ==================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});

// ======================== Redirect home page =====================
app.get(
  "/",
  wrapAsync(async (req, res, next) => {
    res.redirect("/listings");
  })
);

// ============== Searching filter =======================
app.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const listings = await Listing.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    });
    if (listings.length === 0) {
      req.flash("error", "No data found");
      return res.redirect("/listings");
    }
    res.render("listings/index.ejs", { allListings: listings });
  } catch (err) {
    req.flash("error", "Search failed!");
    res.redirect("/listings");
  }
});

//==================== Reset token ========================
app.get("/reset/:token", (req, res) => {
  res.render("users/reset-password", { token: req.params.token });
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// ================== 404 Handler ==================
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ============= Error Hnadlling Middleware =========
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { statusCode = 500, message = "Something Went Wrong" } = err;
  return res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("Litening on 8080");
});
