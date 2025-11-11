const User = require("../models/User");
const Verification = require("../models/Verification");
const createToken = require("../helpers/createToken");
const crypto = require("crypto");
const StoreMember = require("../models/StoreMember");
const sendTemplateEmail = require("../helpers/sendEmail");
// const sendEmail = require("../helpers/sendEmail");
const bcrypt = require("bcrypt");

const UserController = {
  me: async (req, res) => {
    try {
      let store = await StoreMember.findOne({ user: req.user._id })
        .populate("store")
        .lean();
      return res.json({ user: req.user, store });
      // return res.json(req.user);
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: e.message || "Internal Server error" });
    }
  },
  login: async (req, res) => {
    try {
      let { email, password } = req.body;
      let user = await User.login(email, password);
      req.logger.info("user logging in", {
        email,
      });
      let token = createToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: "lax",
        domain: ".nexoradigital.site",
      });
      let store = await StoreMember.findOne({ user: user._id })
        .populate("store")
        .lean();

      req.logger.info("user logged in successfully", {
        email,
      });
      return res.json({ user, store, token });
      // return res.json({ user, token });
    } catch (e) {
      req.logger.error("user logged in faield", {
        email,
      });
      return res.status(400).json({ error: e.message });
    }
  },
  register: async (req, res) => {
    try {
      let { username, email, password, countryCode, phoneLocal } = req.body;
      req.logger.info("Registering", {
        username,
        email,
        countryCode,
      });
      let user = await User.register(
        username,
        email,
        password,
        countryCode,
        phoneLocal
      );
      let token = createToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: "lax",
        domain: ".nexoradigital.site",
      });
      req.logger.info("Registered successfully", {
        username,
        email,
        countryCode,
      });
      return res.json({ user, token });
    } catch (e) {
      req.logger.error("Error Registering user", {
        message: e.message,
        stack: e.stack,
        data: { username, email, countryCode },
      });
      return res.status(400).json({ error: e.message });
    }
  },
  logout: (req, res) => {
    res.cookie("jwt", "", {
      httpOnly: true,
      maxAge: 1,
      secure: true,
      sameSite: "lax",
      domain: ".nexoradigital.site",
    });
    
    req.logger.info("user logged out", {
      requestId: req.logger.defaultMeta.requestId,
    });
    return res.json({ message: "user logged out" });
  },
  verify: async (req, res) => {
    try {
      const { email, code } = req.body;
      const codeString = code.join("");
      req.logger.info("finding user", {
        email,
        code,
      });
      const user = await User.findOne({ email });

      if (!user) {
        req.logger.warn("User not found", {
          email,
          code,
        });
        return res.status(400).json({ message: "User not found" });
      }
      if (user.isVerified) {
        req.logger.warn("Already verified", {
          email,
          code,
        });
        return res.status(400).json({ message: "Already verified" });
      }

      const verification = await Verification.findOne({
        userId: user._id,
        code: codeString,
        type: "email",
      });

      if (!verification) {
        req.logger.warn("Invalid code", {
          email,
          code,
        });
        return res.status(400).json({ message: "Invalid code" });
      }

      if (verification.expiresAt < Date.now()) {
        req.logger.warn("Code expired", {
          email,
          code,
        });
        return res.status(400).json({ message: "Code expired" });
      }

      user.isVerified = true;
      (user.onboarding_step = 3), await user.save();

      await Verification.deleteOne({ _id: verification._id });

      req.logger.info("Email verified successfully", {
        email,
        code,
      });
      res.json({ message: "Email verified successfully" });
    } catch (e) {
      console.error(e);
      req.logger.error("Error verifying user", {
        message: e.message,
        stack: e.stack,
        email: req.body.email,
        code: req.body.code,
      });
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  },
  resendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;

      req.logger.info("Resending verification code", { email });

      const user = await User.findOne({ email });
      if (!user) {
        req.logger.warn("User not found", {
          email,
        });
        return res.status(400).json({ message: "User not found" });
      }

      if (user.isVerified) {
        req.logger.warn("User already verified", {
          user,
        });
        return res.status(400).json({ message: "User already verified" });
      }

      const lastCode = await Verification.findOne({
        userId: user._id,
        type: "email",
      }).sort({ createdAt: -1 });

      if (lastCode && lastCode.expiresAt > Date.now() - 60 * 1000) {
        req.logger.warn("Verification code recently sent", {
          userId: user._id,
        });
        return res.status(429).json({
          message:
            "Please check your email for the verification code or try again shortly.",
        });
      }

      await Verification.deleteMany({ userId: user._id, type: "email" });

      const verificationCode = crypto.randomInt(100000, 999999).toString();

      await Verification.create({
        userId: user._id,
        code: verificationCode,
        type: "email",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const variables = {
        name: user.username,
        code: verificationCode,
      };
      await sendTemplateEmail(user.email, user.username, 7309359, variables);
      req.logger.info("Verification code email sent", {
        userId: user._id,
        email: user.email,
      });

      return res.json({ message: "Verification code resent" });
    } catch (e) {
      req.logger.error("Error resending VerificationCode", {
        message: e.message,
        stack: e.stack,
        email: req.body.email,
      });
      return res.status(500).json({ message: e.message || "Server error" });
    }
  },
  skip: async (req, res) => {
    try {
      let userId = req.user._id;

      req.logger.info("Skipping onboarding", { userId });

      let existingUser = await User.findById(userId);
      if (!existingUser) {
        req.logger.warn("User not found", { userId });
        return res.status(400).json({ message: "User not found" });
      }
      let update = {
        $inc: {
          onboarding_step: 1,
        },
      };
      let updatedUser;
      if (existingUser.onboarding_step < 7) {
        updatedUser = await User.findByIdAndUpdate(userId, update, {
          new: true,
        });
      }
      let store = await StoreMember.findOne({ user: updatedUser._id })
        .populate("store")
        .lean();
      req.logger.info("Successfully Skipped onboarding", { userId });
      return res.json({ user: updatedUser.toObject(), store });
    } catch (e) {
      req.logger.error("Error Skipping onboarding", {
        message: e.message,
        stack: e.stack,
        userId: req.user._id,
      });
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  },
  forgetPassword: async (req, res) => {
    const { email } = req.body;

    req.logger.info("sending forget password", { email });

    const user = await User.findOne({ email });
    if (!user) {
      req.logger.info("User not found", { email });
      return res.status(404).json({ message: "User not found" });
    }

    let token = createToken(user._id, "1h");

    const resetUrl = `${process.env.ORIGIN}/new-password/${token}`;

    try {
      const variables = {
        username: user.username,
        resetUrl,
      };
      await sendTemplateEmail(user.email, user.username, 7309376, variables);

      req.logger.info("Password reset email sent", { email });

      res.json({ message: "Password reset email sent" });
    } catch (e) {
      req.logger.error("Error sending Password reset email", {
        message: e.message,
        stack: e.stack,
        userId: req.body.email,
      });
      res.status(500).json({ message: e.message || "Email could not be sent" });
    }
  },
  resetPassword: async (req, res) => {
    const { password } = req.body;

    try {
      let userId = req.user._id;
      req.logger.info("resetting password", { userId });
      let salt = await bcrypt.genSalt();
      let hashValue = await bcrypt.hash(password, salt);

      let updatedUser = await User.findByIdAndUpdate(
        userId,
        { password: hashValue },
        {
          new: true,
        }
      );

      req.logger.info("reseted password successfully", { userId });
      return res.json({ user: updatedUser.toObject() });
    } catch (e) {
      req.logger.error("Error resetting Password reset email", {
        message: e.message,
        stack: e.stack,
        requestId: req.logger.defaultMeta.requestId,
      });
      res
        .status(400)
        .json({ message: e.message || "Invalid or expired token" });
    }
  },
  update: async (req, res) => {
    try {
      let userId = req.user._id;
      const allowedUpdates = ["username", "phoneLocal", "countryCode"];
      let updatedData = {};
      req.logger.info("updating user info", { userId });
      for (let key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updatedData[key] = req.body[key];
        }
      }

      let existingUser = await User.findById(userId);
      if (!existingUser) {
        req.logger.warn("User not found", { userId });
        return res.status(400).json({ message: "User not found" });
      }

      let updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
        new: true,
      });

      req.logger.info("User info updated", { userId });
      return res.json({ user: updatedUser.toObject() });
    } catch (e) {
      req.logger.error("Error updating User info", {
        message: e.message,
        stack: e.stack,
        userId: req.user._id,
      });
      res;
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  },
  updateRegistration: async (req, res) => {
    const userId = req.user._id;
    const { username, email, password, countryCode, phoneLocal } = req.body;

    req.logger.info("updating Registration", { userId });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.logger.warn("Email already in use", { email });
      return res.status(400).json({ msg: "Email already in use" });
    }

    const user = await User.findById(userId);
    if (!user) {
      req.logger.warn("User not found", { userId });
      return res.status(404).json({ msg: "User not found" });
    }
    if (user.isVerified) {
      req.logger.warn("Cannot change verified email", { email });
      return res.status(400).json({ msg: "Cannot change verified email" });
    }

    user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, salt);
    }
    user.username = username;
    user.onboarding_step = 2;
    user.countryCode = countryCode;
    user.phoneLocal = phoneLocal;

    await user.save();

    await Verification.deleteMany({ userId: userId });

    // Generate new verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    await Verification.create({
      userId: userId,
      code: verificationCode,
      type: "email",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const variables = {
      name: user.username,
      code: verificationCode,
    };
    await sendTemplateEmail(user.email, user.username, 7309359, variables);

    const updatedUser = await User.findById(userId).select("-password");

    req.logger.info("sent update Registration", { email, userId });

    return res.json({ user: updatedUser });
  },
  prevStep: async (req, res) => {
    try {
      const userId = req.user._id;
      const { onboarding_step } = req.body;

      req.logger.info("going back to previous step", { userId });

      const user = await User.findById(userId);
      if (!user) {
        req.logger.warn("User not found", { userId });
        return res.status(404).json({ error: "User not found" });
      }

      // Update step
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { onboarding_step },
        { new: true }
      ).select("-password");

      req.logger.info("successfully step back", { userId });
      return res.json({ user: updatedUser });
    } catch (e) {
      req.logger.error("Error stepping back", {
        message: e.message,
        stack: e.stack,
        userId: req.user._id,
      });
      return res.status(500).json({ error: e.message });
    }
  },
};

module.exports = UserController;
