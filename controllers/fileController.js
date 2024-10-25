const db = require("../models/queries");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const path = require("node:path");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure multer for in-memory storage
// will be using a cloud storage service, supabase in this case
const storage = multer.memoryStorage();
exports.upload = multer({ storage });

exports.createFileGet = async (req, res) => {
  const folders = await db.getFoldersByUserId(req.user.id);
  res.render("upload", { folders: folders });
};

exports.fileGet = async (req, res) => {
  const file = await db.getFileById(Number(req.params.id));
  res.render("filedetails", { file: file });
};

exports.uploadFile = async (req, res) => {
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
  // Get public URL
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

  res.redirect("/");
};
