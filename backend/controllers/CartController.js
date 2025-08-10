const redisClient = require("../config/redisClient");
const { v4: uuidv4 } = require("uuid");

const CartController = {
  show: async (req, res) => {
    const { cartId } = req.params;
    try {
      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);

      if (!cartData) {
        return res.status(404).json({ msg: "Cart not found or expired" });
      }
      console.log("cartData", cartData);
      const cart = JSON.parse(cartData);
      return res.json(cart);
    } catch (error) {
      console.error("Error retrieving cart:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  store: async (req, res) => {
    try {
      let {
        cartId,
        basePrice,
        totalPrice,
        items: {
          productId,
          trackQuantityEnabled,
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

      if (!cartId) {
        cartId = uuidv4();
      }
      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);

      let cart;
      if (cartData) {
        // Existing cart -> push new item
        // cart = JSON.parse(cartData);
        cart = cartData;
        const items = cart.order?.items || cart.items || [];
        console.log("cartpush", cart);
        items.push({
          id: uuidv4(),
          productId,
          trackQuantityEnabled,
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
      } else {
        // New cart
        cart = {
          id: cartId,
          items: [
            {
              id: uuidv4(),
              productId,
              trackQuantityEnabled,
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
            },
          ],
          createdAt: Date.now(),
        };
      }

      // Save to Redis with TTL
      //   await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));
      await redisClient.set(cartKey, JSON.stringify(cart), { ex: 86400 });

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      console.error("Error storing cart:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  update: async (req, res) => {
    try {
      const { cartId } = req.params;
      const {
        productId,
        variantId,
        quantity,
        optionName,
        optionValue,
        optionQuantity,
      } = req.body;
      console.log("req.body", req.body);
      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);
      if (!cartData) return res.status(404).json({ msg: "Cart not found" });

      //   const cart = JSON.parse(cartData);
      const cart = cartData;
      console.log("cart", cart);
      const items = cart.order?.items || cart.items || [];
      const foundItem = items.find(
        (i) => i.productId === productId && i.variantId === variantId
      );

      //   const item = cart.order.items.find(
      //     (i) => i.productId === productId && i.variantId === variantId
      //   );
      if (!foundItem) return res.status(404).json({ msg: "Item not found" });

      // Update quantity
      if (typeof quantity === "number") {
        foundItem.quantity = quantity;
      }

      // Update specific option quantity
      if (optionName && optionValue && typeof optionQuantity === "number") {
        const option = foundItem.options.find((o) => o.name === optionName);
        if (!option) return res.status(404).json({ msg: "Option not found" });

        const index = option.answers.findIndex((a) => a === optionValue);
        if (index === -1)
          return res.status(404).json({ msg: "Answer not found" });

        option.quantities[index] = optionQuantity;
      }

      // ✅ Recalculate totalPrice: only basePrice * quantity + option prices once
      const optionExtra =
        foundItem.options?.reduce((acc, option) => {
          return acc + option.prices.reduce((sum, p) => sum + p, 0);
        }, 0) || 0;

      foundItem.totalPrice =
        foundItem.basePrice * foundItem.quantity + optionExtra;

      //   await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));
      await redisClient.set(cartKey, JSON.stringify(cart), { ex: 86400 });

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      console.error("Error patching cart item:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  removeItem: async (req, res) => {
    try {
      const { cartId, productId, variantId } = req.params;

      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);
      if (!cartData) return res.status(404).json({ msg: "Cart not found" });

      const cart = JSON.parse(cartData);
      console.log("UPDATE", cart);
      const items = cart.order?.items || cart.items || [];
      const initialLength = items.length;
      // Filter out the matching item
      cart.items = items.filter((item) => {
        const productMatch = item.productId === productId;
        const variantMatch = variantId
          ? item.variantId === variantId
          : !item.variantId;
        return !(productMatch && variantMatch);
      });

      if (cart.items.length === initialLength) {
        return res.status(404).json({ msg: "Item not found in cart" });
      }

      if (cart.items.length === 0) {
        // Remove entire cart from Redis
        // await redisClient.del(cartKey);
        return res.status(200).json({ success: true, cartDeleted: true });
      }

      // Otherwise, update Redis with new cart
      //   await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));
      await redisClient.set(cartKey, JSON.stringify(cart), { ex: 86400 });

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      console.error("Error removing cart item:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
};

module.exports = CartController;
