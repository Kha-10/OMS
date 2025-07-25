const redisClient = require("../config/redisClient");
const { v4: uuidv4 } = require("uuid");

const CartController = {
  show: async (req, res) => {
    const { cartId } = req.params;
    console.log("cartId", cartId);
    try {
      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);

      if (!cartData) {
        return res.status(404).json({ msg: "Cart not found or expired" });
      }

      const cart = JSON.parse(cartData);
      return res.json(cart);
    } catch (error) {
      console.error("Error retrieving cart:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
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
          id: uuidv4(),
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

      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);
      if (!cartData) return res.status(404).json({ msg: "Cart not found" });

      const cart = JSON.parse(cartData);
      const item = cart.items.find(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (!item) return res.status(404).json({ msg: "Item not found" });

      // Update quantity
      if (typeof quantity === "number") {
        item.quantity = quantity;
      }

      // Update specific option quantity
      if (optionName && optionValue && typeof optionQuantity === "number") {
        const option = item.options.find((o) => o.name === optionName);
        if (!option) return res.status(404).json({ msg: "Option not found" });

        const index = option.answers.findIndex((a) => a === optionValue);
        if (index === -1)
          return res.status(404).json({ msg: "Answer not found" });

        option.quantities[index] = optionQuantity;
      }

      // ✅ Recalculate totalPrice: only basePrice * quantity + option prices once
      const optionExtra =
        item.options?.reduce((acc, option) => {
          return acc + option.prices.reduce((sum, p) => sum + p, 0);
        }, 0) || 0;

      item.totalPrice = item.basePrice * item.quantity + optionExtra;

      await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));

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
      const initialLength = cart.items.length;

      // Filter out the matching item
      cart.items = cart.items.filter((item) => {
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
        await redisClient.del(cartKey);
        return res.status(200).json({ success: true, cartDeleted: true });
      }

      // Otherwise, update Redis with new cart
      await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      console.error("Error removing cart item:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
};

module.exports = CartController;
