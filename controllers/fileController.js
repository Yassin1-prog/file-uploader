const db = require("../models/queries");

exports.createFileGet = async (req, res) => {
  const folders = await db.getFoldersByUserId(req.user.id);
  res.render("upload", { folders: folders });
};

exports.createFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const folderId = req.body.folderId;

  const fileInfo = {
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
    folderId: folderId || null, // Store as null if no folder was selected
    uploadDate: new Date(),
  };

  await db.createFile(
    fileInfo.originalName,
    fileInfo.size,
    fileInfo.folderId,
    req.user.id,
    ""
  );
  res.redirect("/home");
};
