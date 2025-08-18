const User = require("../models/User");
const Verification = require("../models/Verification");
const createToken = require("../helpers/createToken");
const crypto = require("crypto");

const UserController = {
  me: async (req, res) => {
    try {
      return res.json(req.user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server error" });
    }
  },
  login: async (req, res) => {
    try {
      let { email, password } = req.body;
      let user = await User.login(email, password);

      let token = createToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,
      });
      return res.json({ user, token });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  },
  register: async (req, res) => {
    try {
      let { username, email, password, countryCode, phoneLocal } = req.body;
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
      });
      return res.json({ user, token });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  },
  logout: (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    return res.json({ message: "user logged out" });
  },
  verify: async (req, res) => {
    try {
      const { email, code } = req.body;
      const codeString = code.join("");
      console.log("email", email);
      const user = await User.findOne({ email });

      if (!user) return res.status(400).json({ message: "User not found" });
      if (user.isVerified)
        return res.status(400).json({ message: "Already verified" });

      const verification = await Verification.findOne({
        userId: user._id,
        code: codeString,
        type: "email",
      });

      if (!verification) {
        return res.status(400).json({ message: "Invalid code" });
      }

      if (verification.expiresAt < Date.now()) {
        return res.status(400).json({ message: "Code expired" });
      }

      user.isVerified = true;
      (user.onboarding_step = 3), await user.save();

      await Verification.deleteOne({ _id: verification._id });

      res.json({ message: "Email verified successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  resendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "User already verified" });
      }

      const lastCode = await Verification.findOne({
        userId: user._id,
        type: "email",
      }).sort({ createdAt: -1 });

      if (lastCode && lastCode.expiresAt > Date.now() - 60 * 1000) {
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

      // Send email
      await sendEmail({
        viewFilename: "email",
        data: { verificationCode },
        from: "nexoraDigital@gmail.com",
        to: user.email,
      });

      return res.json({ message: "Verification code resent" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  },
  skip: async (req, res) => {
    try {
      let userId = req.user._id;
      console.log("user", userId);
      let existingUser = await User.findById(userId);
      if (!existingUser) {
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
      return res.json(updatedUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = UserController;
