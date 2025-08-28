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
        secure: true,
        sameSite: "lax",
        domain: ".nexoradigital.site",
      });
      let store = await StoreMember.findOne({ user: user._id })
        .populate("store")
        .lean();
      return res.json({ user, store, token });
      // return res.json({ user, token });
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
        secure: true,
        sameSite: "lax",
        domain: ".nexoradigital.site",
      });
      return res.json({ user, token });
    } catch (e) {
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Server error" });
    }
  },
  skip: async (req, res) => {
    try {
      let userId = req.user._id;
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
      let store = await StoreMember.findOne({ user: updatedUser._id })
        .populate("store")
        .lean();
      return res.json({ user: updatedUser.toObject(), store });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  forgetPassword: async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    let token = createToken(user._id, "1h");

    const resetUrl = `${process.env.ORIGIN}/new-password/${token}`;

    try {
      const variables = {
        username: user.username,
        resetUrl,
      };
      await sendTemplateEmail(user.email, user.username, 7262244, variables);
      // await sendEmail({
      //   viewFilename: "passwordReset",
      //   data: {
      //     resetUrl,
      //   },
      //   from: "nexoraDigital@gmail.com",
      //   to: user.email,
      // });
      res.json({ message: "Password reset email sent" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Email could not be sent" });
    }
  },
  resetPassword: async (req, res) => {
    const { password } = req.body;

    try {
      let userId = req.user._id;

      let salt = await bcrypt.genSalt();
      let hashValue = await bcrypt.hash(password, salt);

      let updatedUser = await User.findByIdAndUpdate(
        userId,
        { password: hashValue },
        {
          new: true,
        }
      );

      return res.json({ user: updatedUser.toObject() });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Invalid or expired token" });
    }
  },
};

module.exports = UserController;
