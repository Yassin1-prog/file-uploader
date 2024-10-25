const db = require("../models/queries");

exports.createFileGet = async (req, res) => {
  const folders = await db.getFoldersByUserId(req.user.id);
  res.render("upload", { folders: folders });
};

exports.fileGet = async (req, res) => {
  const file = await db.getFileById(Number(req.params.id));
  res.render("filedetails", { file: file });
};
