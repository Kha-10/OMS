const redisClient = require("../config/redisClient");

const CartController = {
  store: async (req, res) => {
    try {
      const {
        cartId,
        basePrice,
        totalPrice,
        items: {
          productId,
          variantId,
          productName,
          photo,
          imgUrls,
          categories,
          productinventory,
          cartMaximum,
          cartMinimum,
          quantity,
          options,
        },
      } = req.body;
      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);

      const cart = cartData
        ? JSON.parse(cartData)
        : {
            id: cartId,
            items: [],
            createdAt: Date.now(),
          };

      const index = cart.items.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );

      if (index > -1) {
        cart.items[index].quantity += quantity;
        cart.items[index].totalPrice += totalPrice;
        cart.items[index].basePrice += basePrice;
      } else {
        cart.items.push({
          productId,
          variantId,
          productName,
          photo,
          imgUrls,
          categories,
          productinventory,
          cartMaximum,
          cartMinimum,
          quantity,
          options,
          basePrice,
          totalPrice,
        });
      }

      // Save to Redis with TTL
      await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      console.error("Error storing cart:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
};

module.exports = CartController;
