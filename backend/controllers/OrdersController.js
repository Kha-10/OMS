const Order = require("../models/Order");
const Product = require("../models/Product");
const Counter = require("../models/Counter");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");
const clearProductCache = require("../helpers/clearProductCache");
const clearCartCache = require("../helpers/clearCartCache");
const resetCounters = require("../helpers/reset");
const orderService = require("../services/orderService");
const handler = require("../helpers/handler");
const redisClient = require("../config/redisClient");

const OrdersController = {
  index: async (req, res) => {
    try {
      const queryParams = req.query;
      let { orders, totalOrders, page, limit } = await orderService.findOrders(
        queryParams
      );

      const response = {
        data: orders,
        pagination: {
          totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPreviousPage: page > 1,
        },
      };

      return res.json(response);
    } catch (error) {
      return res.status(500).json({ msg: "internal server error" });
    }
  },
  store: async (req, res) => {
    const { customer, cartId, items, notes, orderStatus, pricing } = req.body;
    const idempotencyKey = req.idempotencyKey;
    const cartLockKey = `lock:cart:${cartId}`;
    const isLocked = await redisClient.get(cartLockKey);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let customerId = null;
      let manualCustomer = null;

      if (
        customer.customerId &&
        mongoose.Types.ObjectId.isValid(customer.customerId)
      ) {
        customerId = customer.customerId;
      } else {
        manualCustomer = {
          name: customer.name?.trim() || "",
          phone: customer.phone?.trim() || "",
          email: customer.email,
          deliveryAddress: customer.deliveryAddress,
        };
      }

      if (!customerId && !manualCustomer) {
        return res.status(400).json({ error: "Customer info is required." });
      }

      if (isLocked) {
        return res
          .status(409)
          .json({ msg: "Cart is currently being processed" });
      }
      // await redisClient.setEx(cartLockKey, 30, "locked");
      await redisClient.set(cartLockKey, "locked", { ex: 30 });

      const orderCounter = await Counter.findOneAndUpdate(
        { id: "orderNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // Fetch and update invoiceNumber counter
      const invoiceCounter = await Counter.findOneAndUpdate(
        { id: "invoiceNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // Ensure we got the updated values
      const orderNumber = orderCounter.seq;
      const invoiceNumber = invoiceCounter.seq;

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);

        if (!product) {
          throw new Error("Product not found");
        }

        if (
          product.trackQuantityEnabled &&
          product.inventory.quantity < item.quantity
        ) {
          throw new Error(`Insufficient inventory for product ${product.name}`);
        }

        // Subtract the inventory
        if (product.trackQuantityEnabled) {
          product.inventory.quantity -= item.quantity;
          await product.save({ session });
        }
      }

      const existingCustomer = await Customer.findById(customerId).session(
        session
      );
      if (existingCustomer) {
        existingCustomer.name = customer.name;
        existingCustomer.email = customer.email;
        existingCustomer.phone = customer.phone;
        existingCustomer.deliveryAddress = customer.deliveryAddress;

        await existingCustomer.save({ session });
      }

      const [order] = await Order.create(
        [
          {
            customer: customerId,
            manualCustomer,
            items,
            notes,
            orderStatus,
            pricing,
            orderNumber,
            invoiceNumber,
          },
        ],
        { session }
      );

      // await redisClient.setEx(
      //   `idemp:${idempotencyKey}`,
      //   3600,
      //   JSON.stringify({
      //     status: "completed",
      //     orderId: order._id,
      //   })
      // );
      await redisClient.set(
        `idemp:${idempotencyKey}`,
        JSON.stringify({
          status: "completed",
          orderId: order._id,
        }),
        { ex: 3600 }
      );

      await session.commitTransaction();
      session.endSession();

      await clearProductCache();
      await clearCartCache(`cart:cartId:${cartId}`);
      await redisClient.del(cartLockKey);

      return res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      await session.abortTransaction();
      session.endSession();
      // await redisClient.setEx(
      //   `idemp:${idempotencyKey}`,
      //   600,
      //   JSON.stringify({
      //     status: "failed",
      //     error: error.message,
      //   })
      // );
      await redisClient.set(
        `idemp:${idempotencyKey}`,
        JSON.stringify({
          status: "failed",
          error: error.message,
        }),
        { ex: 600 }
      );
      await redisClient.del(cartLockKey);
      return res
        .status(500)
        .json({ msg: error.message || "internal server error" });
    }
  },
  show: async (req, res) => {
    try {
      const id = req.params.id;
      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid order ID" });
      }

      // Get from DB
      const order = await Order.findById(id).populate("customer");
      if (!order) return res.status(404).json({ msg: "Order not found" });

      const updatedItems = await Promise.all(
        order.items.map(async (item) => {
          const latestProduct = await Product.findById(item.productId);

          if (!latestProduct) return item;

          return {
            ...item.toObject(),
            trackQuantityEnabled: latestProduct.trackQuantityEnabled,
            price: latestProduct.price,
            productName: latestProduct.name,
            productinventory: item.quantity + latestProduct.inventory.quantity,
            cartMinimum: latestProduct.cartMinimumEnabled
              ? latestProduct.cartMinimum
              : 0,
            cartMaximum: latestProduct.cartMaximumEnabled
              ? latestProduct.cartMaximum
              : 0,
            imgUrls: latestProduct.imgUrls || [],
            photo: latestProduct.photo || [],
            options: latestProduct.options || [],
            categories: latestProduct.categories || [],
          };
        })
      );
      console.log("updatedItems", updatedItems);
      order.items = updatedItems;
      await order.save();

      const enhancedOrder = orderService.enhanceProductImages(order);

      return res.json(enhancedOrder);
    } catch (error) {
      console.error("Order show error:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  destroy: async (req, res) => {
    const { id } = req.params;
    const { shouldRestock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handler.handleResponse(res, {
        status: 400,
        message: "Invalid id",
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await orderService.removeOrder(id, session);

        if (!order) {
          throw new Error("Order not found");
        }

        if (shouldRestock) {
          await orderService.restockOrderItems(order, session);
        }
        await clearProductCache();
      });

      session.endSession();
      return handler.handleResponse(res, {
        status: 200,
        message: "Order deleted successfully.",
      });
    } catch (error) {
      await session.endSession();
      return handler.handleError(res, error);
    }
  },
  bulkDestroy: async (req, res) => {
    const { orderIds } = req.body;

    // Validation
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ msg: "empty orderIds" });
    }

    const invalidIds = orderIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ msg: `Invalid order IDs: ${invalidIds.join(", ")}` });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const orders = await Order.find({ _id: { $in: orderIds } }).session(
          session
        );
        console.log("orders", orders);
        if (orders.length === 0) {
          return res.status(404).json({ msg: `No orders found` });
        }

        await Order.deleteMany({ _id: { $in: orderIds } });
      });

      session.endSession();

      return res.json({
        message: `Order status has been Successfully deleted.`,
      });
    } catch (error) {
      console.log("error", error);
      session.endSession();
      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  // Bulk order update
  bulkUpdate: async (req, res) => {
    const { orderIds, orderStatus, paymentStatus, fulfillmentStatus } =
      req.body;
    console.log("orderIds", orderIds);
    console.log("orderStatus", orderStatus);

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ msg: "empty orderIds" });
    }

    const invalidIds = orderIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ msg: `Invalid order IDs: ${invalidIds.join(", ")}` });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const orders = await Order.find({ _id: { $in: orderIds } }).session(
          session
        );
        console.log("orders", orders);
        if (orders.length === 0) {
          return res.status(404).json({ msg: `No orders found` });
        }

        await Order.updateMany(
          { _id: { $in: orderIds } },
          { $set: { orderStatus, paymentStatus, fulfillmentStatus } }
        );
      });

      session.endSession();

      return res.json({
        message: `Order status has been Successfully updated.`,
      });
    } catch (error) {
      console.log("error", error);
      session.endSession();
      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  loadOrderAsCart: async (req, res) => {
    try {
      const { orderId } = req.params;

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ msg: "Invalid order ID" });
      }

      let order = await Order.findById(orderId).populate("customer");
      if (!order) return res.status(404).json({ msg: "Order not found" });

      const updatedItems = await Promise.all(
        order.items.map(async (item) => {
          const latestProduct = await Product.findById(item.productId);

          if (!latestProduct) return item;

          return {
            ...item.toObject(),
            trackQuantityEnabled: latestProduct.trackQuantityEnabled,
            price: latestProduct.price,
            productName: latestProduct.name,
            productinventory: item.quantity + latestProduct.inventory.quantity,
            cartMinimum: latestProduct.cartMinimumEnabled
              ? latestProduct.cartMinimum
              : 0,
            cartMaximum: latestProduct.cartMaximumEnabled
              ? latestProduct.cartMaximum
              : 0,
            imgUrls: latestProduct.imgUrls || [],
            photo: latestProduct.photo || [],
            options: latestProduct.options || [],
            categories: latestProduct.categories || [],
          };
        })
      );

      order.items = updatedItems;
      await order.save();

      const cartId = order._id; // Reuse same cart for this order
      const cartKey = `cart:cartId:${cartId}`;

      // Prepare cart object
      const cart = {
        id: cartId,
        order,
        createdAt: Date.now(),
      };

      // await redisClient.setEx(cartKey, 86400, JSON.stringify(cart));
      await redisClient.set(cartKey, JSON.stringify(cart), { ex: 86400 });

      return res.status(200).json({ cart });
    } catch (error) {
      console.error("Failed to load order as cart:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  discardCart: async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const cartKey = `cart:cartId:${cartId}`;
      const cartData = await redisClient.get(cartKey);

      if (cartData) {
        await clearCartCache(`cart:cartId:${cartId}`);
      } else return res.status(404).json({ msg: "Cart not found" });

      return res.status(200).json({ msg: "Successfully Discarded" });
    } catch (error) {
      console.error("Failed to load order as cart:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  singleOrderedit: async (req, res) => {
    const { id } = req.params;
    const { customer, items, notes, orderStatus, pricing } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid order ID" });
    }

    try {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ msg: "Order not found" });

      let customerId = null;
      let manualCustomer = null;

      if (
        customer.customerId &&
        mongoose.Types.ObjectId.isValid(customer.customerId)
      ) {
        customerId = customer.customerId;
      } else {
        manualCustomer = {
          name: customer.name?.trim() || "",
          phone: customer.phone?.trim() || "",
          email: customer.email,
          deliveryAddress: customer.deliveryAddress,
        };
      }

      if (!customerId && !manualCustomer) {
        return res.status(400).json({ error: "Customer info is required." });
      }

      const originalItems = order.items;
      let needRestockAndDeduct = false;
      for (const originalItem of originalItems) {
        if (originalItem.trackQuantityEnabled) {
          needRestockAndDeduct = true;
          break;
        }
      }

      const existingCustomer = await Customer.findById(customerId);
      if (existingCustomer) {
        existingCustomer.name = customer.name;
        existingCustomer.email = customer.email;
        existingCustomer.phone = customer.phone;
        existingCustomer.deliveryAddress = customer.deliveryAddress;

        await existingCustomer.save();
      }

      if (!needRestockAndDeduct) {
        await Order.updateOne(
          { _id: id },
          {
            customer: customerId,
            manualCustomer,
            items,
            notes,
            orderStatus,
            pricing,
          }
        );
      }
      res.status(200).json({
        msg: "Order updated successfully",
        needRestockAndDeduct,
      });
    } catch (error) {
      console.error("Order edit failed:", error);
      res.status(500).json({ msg: error.message || "Internal server error" });
    } finally {
      if (req.lockKey) {
        await redisClient.del(req.lockKey);
      }
    }
  },
  updateOrder: async (req, res) => {
    const orderId = req.params.id;
    const newItems = req.body.items;
    const notes = req.body.notes;
    const pricing = req.body.pricing;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Get original order
      const originalOrder = await Order.findById(orderId).lean();
      if (!originalOrder) {
        return res.status(400).json({ msg: "Order not found" });
      }
      let product;
      // 2. Restore previous quantities
      for (const item of originalOrder.items) {
        product = await Product.updateOne(
          { _id: item.productId, trackQuantityEnabled: true },
          { $inc: { "inventory.quantity": item.quantity } },
          { session }
        );
      }

      // 3. Deduct new quantities
      for (const item of newItems) {
        product = await Product.updateOne(
          { _id: item.productId, trackQuantityEnabled: true },
          { $inc: { "inventory.quantity": -item.quantity } },
          { session }
        );
      }
      // 4. Update the order document
      await Order.updateOne(
        {
          _id: orderId,
        },
        { $set: { items: newItems, notes, pricing } },
        { session }
      );

      await clearProductCache();
      await session.commitTransaction();
      session.endSession();
      return res.json({ success: true });
    } catch (error) {
      console.error("Order edit failed:", error);
      res.status(500).json({ msg: error.message || "Internal server error" });
      await session.abortTransaction();
      session.endSession();
    }
  },
  deduct: async (req, res) => {
    console.log("req.body", req.body);
    const orderId = req.body._id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const originalOrder = await Order.findById(orderId).lean();

      if (!originalOrder) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "Order not found" });
      }

      await Product.bulkWrite(
        originalOrder.items.map((item) => ({
          updateOne: {
            filter: { _id: item.productId, trackQuantityEnabled: true },
            update: { $inc: { "inventory.quantity": -item.quantity } },
          },
        })),
        { session }
      );

      await clearProductCache();

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ msg: "Inventory deducted successfully" });
    } catch (error) {
      console.error("Order deduct failed:", error);

      await session.abortTransaction();
      session.endSession();

      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  restock: async (req, res) => {
    console.log("req.body", req.body);
    const orderId = req.body._id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const originalOrder = await Order.findById(orderId).lean();

      if (!originalOrder) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "Order not found" });
      }

      await Product.bulkWrite(
        originalOrder.items.map((item) => ({
          updateOne: {
            filter: { _id: item.productId, trackQuantityEnabled: true },
            update: { $inc: { "inventory.quantity": item.quantity } },
          },
        })),
        { session }
      );

      await clearProductCache();

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ msg: "Inventory restocked successfully" });
    } catch (error) {
      console.error("Order restock failed:", error);

      await session.abortTransaction();
      session.endSession();

      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  refund: async (req, res) => {
    console.log("req.body", req.body);
    const customerId = req.body.customer._id;
    const totalSpent = req.body.pricing.finalTotal;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findById(customerId).lean();

      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "customer not found" });
      }

      // ✅ Fix: Proper bulkWrite syntax as array of operations
      await Customer.bulkWrite(
        [
          {
            updateOne: {
              filter: { _id: customerId },
              update: { $inc: { totalSpent: -totalSpent } },
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ msg: "Refund processed successfully" });
    } catch (error) {
      console.error("Refund failed:", error);

      await session.abortTransaction();
      session.endSession();

      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  pay: async (req, res) => {
    console.log("req.body", req.body);
    const customerId = req.body.customer._id;
    const totalSpent = req.body.pricing.finalTotal;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await Customer.findById(customerId).lean();

      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "customer not found" });
      }

      // ✅ Fix: Proper bulkWrite syntax as array of operations
      await Customer.bulkWrite(
        [
          {
            updateOne: {
              filter: { _id: customerId },
              update: { $inc: { totalSpent: totalSpent } },
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ msg: "Pay processed successfully" });
    } catch (error) {
      console.error("Pay failed:", error);

      await session.abortTransaction();
      session.endSession();

      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
};

module.exports = OrdersController;
