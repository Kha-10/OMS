const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// const sendEmail = require("../helpers/sendEmail");
const Verification = require("./Verification");
const sendTemplateEmail = require("../helpers/sendEmail");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  countryCode: String,
  phoneLocal: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  onboarding_step: {
    type: Number,
    default: 1,
  },
});

UserSchema.statics.register = async function (
  username,
  email,
  password,
  countryCode,
  phoneLocal
) {
  let userExists = await this.findOne({ email });
  if (userExists) {
    throw new Error("user already exists");
  }

  let salt = await bcrypt.genSalt();
  let hashValue = await bcrypt.hash(password, salt);

  const verificationCode = crypto.randomInt(100000, 999999).toString();

  let user = await this.create({
    username,
    email,
    password: hashValue,
    countryCode,
    phoneLocal,
    onboarding_step: 2,
  });

  await Verification.create({
    userId: user._id,
    code: verificationCode,
    type: "email",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  // await sendEmail({
  //   viewFilename: "email",
  //   data: {
  //     verificationCode,
  //   },
  //   from: "nexoraDigital@gmail.com",
  //   to: user.email,
  // });

  const variables = {
    name: user.username,
    code: verificationCode,
  };
  await sendTemplateEmail(user.email, user.username, 7309359, variables);

  return user;
};

UserSchema.statics.login = async function (email, password) {
  let user = await this.findOne({ email });
  if (!user) {
    throw new Error("user does not exists");
  }
  let isCorrect = await bcrypt.compare(password, user.password);
  if (isCorrect) {
    return user;
  } else {
    throw new Error("Password incorrect");
  }
};

module.exports = mongoose.model("User", UserSchema);
