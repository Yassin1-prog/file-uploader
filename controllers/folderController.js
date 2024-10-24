const db = require("../models/queries");
const { body, validationResult } = require("express-validator");

const validateFolder = [
  body("folder")
    .trim()
    .isAlphanumeric("en-US", { ignore: " " })
    .withMessage("Name must contain only alphanumeric characters and spaces")
    .isLength({ min: 5, max: 30 })
    .withMessage("Name must be between 5 and 30 characters long"),
];

exports.createFolder = [
  validateFolder,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("newfolder", {
        errors: errors.array(),
      });
    }

    const { folder } = req.body;
    const duplicate = await db.getFolder(folder);
    if (duplicate) {
      return res.status(400).render("newfolder", {
        err: "The folder name arleady exists, try a new one",
      });
    }
    await db.createFolder(folder, req.user.id);
    res.redirect("/home");
  },
];

exports.updateFolder = [
  validateFolder,
  async (req, res, next) => {
    const errors = validationResult(req);
    const oldfolder = await db.getFolderById(Number(req.params.id));
    if (!errors.isEmpty()) {
      return res.status(400).render("updatefolder", {
        errors: errors.array(),
        folder: oldfolder,
      });
    }
    const { folder } = req.body;
    const duplicate = await db.getFolder(folder);
    if (duplicate) {
      return res.status(400).render("updatefolder", {
        err: "The folder name arleady exists, try a new one",
        folder: oldfolder,
      });
    }
    await db.updateFolder(req.user.id, folder);
    res.redirect("/home");
  },
];

exports.deleteFolder = async (req, res) => {
  await db.deleteFolder(Number(req.params.id));
  res.redirect("/home");
};