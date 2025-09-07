const redisClient = require("../config/redisClient.js");
const clearCartCache = require("../helpers/clearCart.js");

const getCart = async (cartId, storeId) => {
  console.log("cartId",cartId);
  console.log("storeId",storeId);
  const cartKey = `cart:storeId:${storeId}cartId:${cartId}`;
  return await redisClient.get(cartKey);
};

const discardCart = async (cartId, storeId) => {
  const cartKey = `cart:storeId:${storeId}cartId:${cartId}`;
  await clearCartCache(cartKey);
  return true;
};

module.exports = { getCart, discardCart };
