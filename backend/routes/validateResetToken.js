const express = require("express");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const AuthMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const User = require("../models/User");
const Token = require("../models/Token")

router.get("/:token", async (req, res) => {
  const { token } = req.params;
  try {
    // Find the token in the database
    const resetToken = await Token.findOne({ token }).populate('tennatID');

    // If no token is found, return an error
    if (!resetToken) {
      return res.status(404).json({ message: "Token doesn't exist." });
    }
    const expiresAtDate = new Date(resetToken.expiresAt);
    const currentTime = new Date();

    // Check if the token has expired
    if (currentTime>=expiresAtDate ) {
      return res.status(400).json({ message: "Token has expired" });
    }

    // If token is valid, get the user information
    const user = resetToken.tennatID;
    // console.log(user);

    // if (user.role === "admin") {
    //   return res.json({ isValid: true, isAdmin: true });
    // } else if (user.role === "tenant") {
    //   return res.json({ isValid: true, isAdmin: false });
    // } else {
    //   return res.status(400).json({ message: "Unknown user role" });
    // }
    res.json(user)
  } catch (error) {
    console.error("Error validating reset token:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
