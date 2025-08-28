const jwt = require("jsonwebtoken");

// const maxAge = 3 * 24 * 60 * 60;

module.exports = function createToken(_id, expiresIn = 3 * 24 * 60 * 60) {
  return jwt.sign({ _id }, process.env.JWT_SECRET_KEY, {
    expiresIn,
  });
};
