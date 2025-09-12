const express = require("express");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const AuthMiddleware = require("../middlewares/authMiddleware");
const createToken = require("../helpers/createToken");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/User");
const Token = require("../models/Token");
const sendEmail = require("../helpers/sendEmail");

const Queue = require("bull");

const emailQueue = new Queue("emailQueue", {
  redis: { port: 6379, host: "127.0.0.1" },
});

emailQueue.process(async function (job, done) {
  try {
    await sendEmail(job.data);
    done();
  } catch (error) {
    console.error("Error processing email job:", job.id, error);
    done(error);
  }
});

router.post("", AuthMiddleware, async (req, res) => {
  const { password, token } = req.body;
  try {
    const storedToken = await Token.findOne({ token }).populate('tennatID');
    const expiresAtDate = new Date(storedToken.expiresAt);
    const currentTime = new Date();
    if (!storedToken || currentTime >= expiresAtDate) {
      return res.status(400).json({ message: "Token expired or invalid." });
    }

    const salt = await bcrypt.genSalt();
    const hashValue = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(storedToken.tennatID, { password: hashValue });

    await Token.deleteOne({ token });

    // let users = await User.find(null, ["email"]);
    // let usersEmails = users.map((user) => user.email);
    // let filteredUsers = usersEmails.filter(
    //   (email) => email !== req.user.email
    // );
    await emailQueue.add({
      viewFilename: "passwordReset",
      data: {
        // name: req.user.username,
        // recipe,
        username: storedToken.tennatID.username,
        // resetLink: resetLink,
      },
      from: req.superadmin.name,
      to: storedToken.tennatID.email,
    });

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error validating reset token:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
