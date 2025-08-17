const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60;

module.exports = function createToken(_id, storeId) {
  const payload = { _id };
  if (storeId) payload.storeId = storeId;
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge,
  });
};
