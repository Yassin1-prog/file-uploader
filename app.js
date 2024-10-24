const express = require("express");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("./models/queries");
const multer = require("multer");
const fs = require("fs");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");

const signupController = require("./controllers/signupController");
const fileController = require("./controllers/fileController");
const folderController = require("./controllers/folderController");

const app = express();
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be stored in the 'uploads' directory
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    // The file will be saved as its original name with a timestamp prefix to avoid conflicts
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Set up multer middleware to use the storage config
const upload = multer({ storage: storage });

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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

// index log in route
app.get("/", async (req, res) => {
  res.render("index");
});

app.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/home",
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

// signup route

app.get("/signup", async (req, res) => {
  res.render("signup");
});

app.post("/signup", signupController.createUser);

//homepage route

app.get("/home", async (req, res) => {
  const folders = await db.getFoldersByUserId(req.user.id);
  const files = await db.getFilesWithNoFolder();
  res.render("home", { user: req.user, folders: folders, files: files });
});

app.get("/newfolder", async (req, res) => {
  res.render("newfolder");
});

app.post("/newfolder", folderController.createFolder);

app.get("/folder/edit/:id", async (req, res) => {
  const folder = await db.getFolderById(Number(req.params.id));
  res.render("updatefolder", { folder: folder });
});

app.post("/folder/edit/:id", folderController.updateFolder);

app.post("/folder/delete/:id", folderController.deleteFolder);

app.get("/upload", fileController.createFileGet);

app.post("/upload", upload.single("file"), (req, res) => {
  // Access file details via req.file
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // File details
  const fileInfo = {
    filename: req.file.filename,
    size: req.file.size,
    path: req.file.path,
  };

  res.send(`File uploaded successfully: ${fileInfo.filename}`);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Express app - listening on port ${PORT}!`));
