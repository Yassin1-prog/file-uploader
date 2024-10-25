const express = require("express");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("./models/queries");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");

const signupController = require("./controllers/signupController");
const fileController = require("./controllers/fileController");
const folderController = require("./controllers/folderController");

const app = express();
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const prisma = new PrismaClient();
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "cats",
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // remove expired sessions every 2 minutes
      dbRecordIdIsSessionId: true, // Store the session ID as the record ID
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  res.locals.alert = req.flash();
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

passport.use(
  new LocalStrategy(async (email, password, done) => {
    try {
      const user = await db.getUserByEmail(email);

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
    const user = await db.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.get("/", async (req, res) => {
  if (req.user) {
    const folders = await db.getFoldersByUserId(req.user.id);
    const files = await db.getFilesWithNoFolder(req.user.id);
    res.render("index", { user: req.user, folders: folders, files: files });
  } else {
    res.render("index");
  }
});

app.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true,
  })
);

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/signup", signupController.getSignUp);
app.post("/signup", signupController.createUser);

app.get("/newfolder", folderController.newfolderGet);
app.post("/newfolder", folderController.createFolder);

app.get("/folder/edit/:id", folderController.updateFolderGet);
app.post("/folder/edit/:id", folderController.updateFolder);
app.post("/folder/delete/:id", folderController.deleteFolder);
app.get("/folder/:id/files", folderController.getFilesInFolder);

app.get("/file/:id", fileController.fileGet);
app.get("/upload", fileController.createFileGet);

app.post(
  "/upload",
  fileController.upload.single("file"),
  fileController.uploadFile
);

//for koyeb deployment config
const PORT = 8000;
app.listen(PORT, () => console.log(`Express app - listening on port ${PORT}!`));
