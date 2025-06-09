const express = require("express");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const AuthMiddleware = require("../middlewares/authMiddleware");
const createToken = require("../helpers/createToken");

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
    console.log("Processing email job:", job.id);
    await sendEmail(job.data);
    done();
  } catch (error) {
    console.error("Error processing email job:", job.id, error);
    done(error);
  }
});

router.post("", AuthMiddleware, async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) return res.status(404).json({message : "User not found"});

    const storedToken = await Token.findOne({ tennatID: existingUser._id });
    const expiresAtDate = storedToken ? new Date(storedToken?.expiresAt) : null;
    const currentTime = new Date();
    if (!storedToken) {
      return res.status(404).json({ message: "Token doesn't exist." });
    } else if (currentTime >= expiresAtDate) {
      return res.status(400).json({ message: "Token expired or invalid." });
    }

    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 1000;

    if (existingUser.lastResetRequest) {
      const timeSinceLastRequest =
        now - existingUser.lastResetRequest.getTime();
      if (timeSinceLastRequest < cooldownPeriod) {
        const timeRemaining = Math.ceil(
          (cooldownPeriod - timeSinceLastRequest) / 1000 / 60
        );
        return res.status(400).json({
          message: `Please wait ${timeRemaining} more minutes before requesting a new reset link.`,
        });
      }
    }

    await User.updateOne(
      { _id: existingUser._id },
      { $set: { lastResetRequest: now } }
    );

    console.log("run");
    await Token.deleteOne({ tennatID: existingUser._id });
    console.log("run 2");
    const token = createToken(existingUser._id, existingUser.role);
    await Token.create({
      tennatID: existingUser._id,
      token: token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      // expiresAt: Date.now() + 3 * 60 * 1000,
    });

    const resetLink = `${process.env.ORIGIN}/reset-password/${token}`;
    let users = await User.find(null, ["email"]);
    let usersEmails = users.map((user) => user.email);
    // let filteredUsers = usersEmails.filter(
    //   (email) => email !== req.user.email
    // );
    await emailQueue.add({
      viewFilename: "tenantRegistrationEmail",
      data: {
        // name: req.user.username,
        // recipe,
        username: existingUser.username,
        resetLink: resetLink,
      },
      from: req.superadmin.name,
      to: usersEmails,
    });
    return res.json({ existingUser, resetLink });
  } catch (error) {
    console.error("Error validating reset token:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
