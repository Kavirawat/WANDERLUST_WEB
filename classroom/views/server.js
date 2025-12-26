const express = require("express");
const app = express();
const users = require("./routes/user.js");
const posts = require("./routes/post.js");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// app.use(cookieParser("secretecode"));

const sessionOpt = {
  secret: "mysupersecretstring",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOpt));
app.use(flash());

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  next();
});

app.get("/register", (req, res) => {
  let { name = "anonymous" } = req.query;
  req.session.name = name;

  if (name === "anonymous") {
    req.flash("error", "user not register!");
  } else {
    req.flash("success", "user register successfuly!");
  }

  res.redirect("/hello");
});

app.get("/hello", (req, res) => {
  res.render("page.ejs", { name: req.session.name });
});

// app.get("/requestcount", (req, res) => {
//   if (req.session.count) {
//     req.session.count++;
//   } else {
//     req.session.count = 1;
//   }

//   res.send(`you send a request ${req.session.count} times`);
// });

// app.get("/test", (req, res) => {
//   res.send("test successful !");
// });

// app.get("/getsignedcookie", (req, res) => {
//   res.cookie("Made-In", "India", { signed: true });
//   res.send("signed cookies send!");
// });

// app.get("/verify", (req, res) => {
//   console.log(req.signedCookies);
//   res.send("cookies send verified!");
// });

// app.get("/getcookies", (req, res) => {
//   res.cookie("greet", "Namaste");
//   res.cookie("MadeIn", "India");
//   res.send("send some cookies!");
// });

// app.get("/greet", (req, res) => {
//   let { name } = req.cookies;
//   res.send(`Hi, ${name}`);
// });

// app.get("/", (req, res) => {
//   console.dir(req.cookies);
//   res.send("This is root route");
// });

// app.use("/users", users);
// app.use("/posts", posts);

app.listen(3000, () => {
  console.log("Server is running on 3000");
});
