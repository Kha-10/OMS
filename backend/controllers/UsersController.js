const User = require("../models/User");
const createToken = require("../helpers/createToken");

const UserController = {
  me: async (req, res) => {
    return res.json(req.user);
  },
  login: async (req, res) => {
    console.log("i work");
    try {
      let { email, password } = req.body;
      let user = await User.login(email, password);
      console.log("mmsp", user);
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
      console.log("email",email);
      const user = await User.findOne({ email });

      if (!user) return res.status(400).json({ message: "User not found" });
      if (user.isVerified)
        return res.status(400).json({ message: "Already verified" });

      if (user.verificationCode !== codeString) {
        return res.status(400).json({ message: "Invalid code" });
      }

      if (user.verificationCodeExpiresAt < Date.now()) {
        return res.status(400).json({ message: "Code expired" });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
      (user.onboarding_step = 3), await user.save();

      res.json({ message: "Email verified successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = UserController;
