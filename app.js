const express = require("express");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
//const db = require("./database/queries");

const app = express();
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));

app.use(flash());
app.use((req, res, next) => {
  res.locals.alert = req.flash();
  next();
});

/*
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await db.getUser(username);

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getUserbyId(id);

    done(null, user);
  } catch (err) {
    done(err);
  }
});
*/

// home route
app.get("/", async (req, res) => {
  res.render("index");
});

app.get("/signup", async (req, res) => {
  res.render("signup");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Express app - listening on port ${PORT}!`));
