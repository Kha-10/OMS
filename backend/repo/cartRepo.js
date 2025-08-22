const redisClient = require("../config/redisClient.js");
const clearCartCache = require("../helpers/clearCartCache");

const getCart = async (cartId, storeId) => {
  const cartKey = `cart:storeId:${storeId}cartId:${cartId}`;
  return await redisClient.get(cartKey);
};

const discardCart = async (cartId, storeId) => {
  const cartKey = `cart:storeId:${storeId}cartId:${cartId}`;
  await clearCartCache(cartKey);
  return true;
};

module.exports = { getCart, discardCart };
