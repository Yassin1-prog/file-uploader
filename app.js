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
require("dotenv").config();
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const signupController = require("./controllers/signupController");
const fileController = require("./controllers/fileController");
const folderController = require("./controllers/folderController");

const app = express();
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// will be using a cloud storage service, supabase in this case
const storage = multer.memoryStorage();
const upload = multer({ storage });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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
  const files = await db.getFilesWithNoFolder(req.user.id);
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

app.get("/file/:id", fileController.fileGet);

app.get("/folder/:id/files", folderController.getFilesInFolder);

app.get("/upload", fileController.createFileGet);

app.post("/upload", upload.single("file"), async (req, res) => {
  // Access file details via req.file
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // IN SUBAPASE DASH I ACCIDENTALLY
  //NAMED THE BUCKET UPLAODS

  // Set file path and name in Supabase
  const filePath = `uploads/${Date.now()}_${req.file.originalname}`;
  const { data, error } = await supabase.storage
    .from("uplaods")
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    return res.status(500).json({ error: "File upload failed" });
  }

  //const { publicURL } = supabase.storage.from("uplaods").getPublicUrl(filePath); deprecated docs
  const {
    data: { publicUrl },
  } = supabase.storage.from("uplaods").getPublicUrl(filePath);
  const folderId = req.body.folderId;
  const folderid = folderId ? Number(folderId) : null;

  await db.createFile(
    req.file.originalname,
    req.file.size,
    folderid,
    req.user.id,
    publicUrl
  );

  res.redirect("/home");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Express app - listening on port ${PORT}!`));
