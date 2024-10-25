const db = require("../models/queries");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const validateSignup = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail() // Normalizes the email address (removes dots for Gmail, etc.)
    .isLength({ min: 5, max: 50 })
    .withMessage("Email must be between 5 and 50 characters long"),

  body("password")
    .trim()
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long"),

  body("confirm-password")
    .trim()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

exports.getSignUp = (req, res) => {
  res.render("signup");
};

exports.createUser = [
  validateSignup,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("signup", {
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const duplicate = await db.getUserByEmail(email);
    if (duplicate) {
      return res.status(400).render("signup", {
        err: "The username arleady exists, try a new one",
      });
    }

    bcrypt.hash(password, 10, async (err, hashedpassword) => {
      if (err) {
        return next(err);
      }
      await db.addUser(email, hashedpassword);
      res.redirect("/");
    });
  },
];
