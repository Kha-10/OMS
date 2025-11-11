const express = require("express");
const UserController = require("../controllers/UsersController");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const { body } = require("express-validator");
const User = require("../models/User");
const AuthMiddleware = require("../middlewares/authMiddleware");
const loggerMiddleware = require("../middlewares/loggerMiddleware");

const router = express.Router();

router.use(loggerMiddleware("users"));

router.get("/me", AuthMiddleware, UserController.me);
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

router.post(
  "/register",
  [
    body("username").notEmpty(),
    body("email").notEmpty(),
    body("email").custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("E-mail already in use");
      }
    }),
    body("password").notEmpty(),
  ],
  handleErrorMessage,
  UserController.register
);

router.post("/verify-email", UserController.verify);

router.post("/resend", UserController.resendVerificationCode);

router.patch("/skip", AuthMiddleware, UserController.skip);

router.patch("/update", AuthMiddleware, UserController.update);

router.post("/forgot-password", UserController.forgetPassword);

router.post(
  "/reset-password/:token",
  AuthMiddleware,
  UserController.resetPassword
);

router.patch(
  "/update-registration",
  AuthMiddleware,
  UserController.updateRegistration
);
router.patch("/prev-step", AuthMiddleware, UserController.prevStep);

module.exports = router;
