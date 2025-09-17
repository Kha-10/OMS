const Order = require("../models/Order");
const Product = require("../models/Product");
const Counter = require("../models/Counter");
const Customer = require("../models/Customer");
const Store = require("../models/Store");
const mongoose = require("mongoose");
const clearProductCache = require("../helpers/clearProductCache");
const clearCartCache = require("../helpers/clearCart");
const resetCounters = require("../helpers/reset");
const orderService = require("../services/orderService");
const cartService = require("../services/cartService");
const handler = require("../helpers/handler");
const redisClient = require("../config/redisClient");
const { getIO } = require("../services/socketService");
const {
  formatWithCurrency,
  buildItemsHtml,
  sendOrderTemplateEmail,
} = require("../helpers/sendOrderEmail");

const OrdersController = {
  index: async (req, res) => {
    try {
      const queryParams = {
        ...req.query,
        storeId: req.storeId,
        deleted: false,
      };

      const { orders, totalOrders, page, limit } =
        await orderService.findOrders(queryParams);

      const enhancedOrders = orderService.enhanceProductImages(orders);

      const response = {
        data: enhancedOrders,
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
      console.error("Order index error:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  store: async (req, res) => {
    const {
      customer,
      customerType,
      cartId,
      items,
      notes,
      orderStatus,
      pricing,
    } = req.body;
    const idempotencyKey = req.idempotencyKey;
    const storeId = req.params.storeId || req.storeId;
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ msg: "Store doesn't exist" });
    }

    try {
      const order = await orderService.createOrder({
        customer,
        customerType,
        cartId,
        items,
        notes,
        orderStatus,
        pricing,
        idempotencyKey,
        storeId: storeId,
        createdBy: req.user?._id,
      });

      if (customerType === "guest") {
        const io = getIO();
        // Emit socket event
        io.emit("new-order", {
          message: "New order created",
          orderNumber: order.orderNumber,
          storeId,
          customerName: order.manualCustomer.name,
        });

        const storeData = await Store.findById(storeId);

        const variables = {
          username: order.manualCustomer.name || "Customer",
          orderNumber: order.orderNumber,
          itemsHtml: buildItemsHtml(order, storeData),
          subtotal: formatWithCurrency(
            order.pricing.subtotal || 0,
            storeData.settings.currency
          ),
          total: formatWithCurrency(
            order.pricing.finalTotal || 0,
            storeData.settings.currency
          ),
        };

        await sendOrderTemplateEmail(
          storeData.email,
          storeData.name,
          6205921,
          variables,
          order.manualCustomer.email,
          order.manualCustomer.name
        );
      }

      return res.json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  show: async (req, res) => {
    try {
      const id = req.params.id;
      const storeId = req.params.storeId || req.storeId;

      const order = await orderService.getOrderWithEnhancedItems(id, storeId);
      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }

      return res.json(order);
    } catch (error) {
      console.error("Order show error:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  destroy: async (req, res) => {
    const { id } = req.params;
    const { shouldRestock } = req.body;
    const storeId = req.storeId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw handler.invalidError("Invalid id");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await orderService.deleteOrder(id, storeId, shouldRestock, session);
      });

      session.endSession();
      return res.json({
        msg: "Order deleted successfully.",
      });
    } catch (err) {
      await session.endSession();
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  bulkDestroy: async (req, res) => {
    try {
      const { orderIds } = req.body;
      const storeId = req.storeId;

      const result = await orderService.bulkDestroyOrders(orderIds, storeId);

      return res.json({
        msg: `${result.deletedCount} orders successfully deleted`,
      });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  bulkUpdate: async (req, res) => {
    const { orderIds, orderStatus, paymentStatus, fulfillmentStatus } =
      req.body;
    const storeId = req.storeId;

    if (!storeId) {
      throw handler.invalidError("storeId is required");
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw handler.notFoundError("empty orderIds");
    }

    const invalidIds = orderIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      throw handler.invalidError(`Invalid order IDs: ${invalidIds.join(", ")}`);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await orderService.bulkUpdate(
        orderIds,
        { orderStatus, paymentStatus, fulfillmentStatus },
        storeId,
        session
      );

      await session.commitTransaction();
      session.endSession();

      return res.json({ msg: "Order status has been successfully updated" });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  loadOrderAsCart: async (req, res) => {
    try {
      const id = req.params.id;
      const storeId = req.storeId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw handler.invalidError("Invalid id");
      }

      const cart = await orderService.loadOrderAsCart(id, storeId);
      if (!cart) {
        throw handler.notFoundError("Order not found");
      }

      return res.status(200).json({ cart });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  discardCart: async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const storeId = req.storeId;

      const result = await cartService.discardCart(cartId, storeId);

      if (!result.success) {
        throw handler.notFoundError(result.msg);
      }

      return res.status(200).json({ msg: result.msg });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  singleOrderEdit: async (req, res) => {
    const { id } = req.params;
    const storeId = req.storeId;
    try {
      const result = await orderService.editSingleOrder(id, storeId, req.body);
      return res.status(200).json({
        msg: "Order updated successfully",
        needRestockAndDeduct: result.needRestockAndDeduct,
      });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    } finally {
      if (req.lockKey) {
        await redisClient.del(req.lockKey);
      }
    }
  },
  updateOrder: async (req, res) => {
    const orderId = req.params.id;
    const { items, notes, pricing } = req.body;
    const storeId = req.storeId;

    try {
      const result = await orderService.updateOrderService(
        orderId,
        storeId,
        items,
        notes,
        pricing
      );

      if (!result.success) {
        // return res.status(404).json({ msg: result.msg });
        throw handler.notFoundError(result.msg);
      }

      return res.json({ success: true });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  deduct: async (req, res) => {
    const { _id: orderId } = req.body;
    const storeId = req.storeId;

    try {
      const result = await orderService.deduct(orderId, storeId);

      if (!result.success) {
        return res.status(result.status).json({ msg: result.msg });
      }

      return res.status(200).json({ msg: "Inventory deducted successfully" });
    } catch (error) {
      console.error("Order deduct failed:", error);
      return res
        .status(500)
        .json({ msg: error.message || "Internal server error" });
    }
  },
  restock: async (req, res) => {
    const { _id: orderId } = req.body;
    const storeId = req.storeId;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await orderService.restockOrder(orderId, storeId, session);

      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return handler.notFoundError("Order not found");
      }

      await session.commitTransaction();
      session.endSession();

      return res.json({
        msg: "Inventory restocked successfully",
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  upload: async (req, res) => {
    try {
      // console.log("REQ", req.randomImageNames);
      let id = req.params.id;
      // console.log("req.params.id", req.params.id);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const isCloudinary = process.env.UPLOAD_PROVIDER === "cloudinary";

      // Build update object depending on provider
      let update = {};
      if (isCloudinary) {
        update = {
          $set: {
            recieptSlip: req.randomImageNames[0]?.public_id,
          },
        };
      } else {
        update = {
          $set: {
            recieptSlip: req.randomImageNames[0],
          },
        };
      }

      const order = await Order.findByIdAndUpdate(id, update, {
        new: true,
      });

      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }
      return res.json(order);
    } catch (error) {
      return res.status(500).json({ msg: "internet server error" });
    }
  },
};

module.exports = OrdersController;
