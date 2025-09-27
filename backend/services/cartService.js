const CartRepo = require("../repo/cartRepo");

const discardCart = async (cartId, storeId) => {
  const cartData = await CartRepo.getCart(cartId, storeId);
 
  if (!cartData) {
    return { success: false, msg: "Cart not found" };
  }

  await CartRepo.discardCart(cartId, storeId);
  return { success: true, msg: "Successfully Discarded" };
};

module.exports = { discardCart };
