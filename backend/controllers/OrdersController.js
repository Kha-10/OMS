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

// Helper to sanitize order items for Order schema
function sanitizeOrderItem(item) {
  return {
    productId: item.productId || item._id,
    quantity: item.quantity,
    cartMaximum: item.cartMaximum,
    cartMinimum: item.cartMinimum,
    inventory:
      typeof item.inventory === "number"
        ? item.inventory
        : item.inventory && typeof item.inventory.quantity === "number"
        ? item.inventory.quantity
        : undefined,
    name: item.name,
    price: item.price,
    trackQuantityEnabled: item.trackQuantityEnabled,
    selectedOptions: item.selectedOptions,
    selectedVariant: item.selectedVariant,
    selectedNumberOption: item.selectedNumberOption,
    photo: item.photo,
    imgUrls: item.imgUrls,
  };
}

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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log("req.body", req.body);
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

      const existingCustomer = await Customer.findById(
        customer.customerId
      ).session(session);
      if (existingCustomer) {
        existingCustomer.totalSpent += pricing.finalTotal;
        existingCustomer.name = customer.name;
        existingCustomer.email = customer.email;
        existingCustomer.phone = customer.phone;

        await existingCustomer.save({ session });
      }

      const [order] = await Order.create(
        [
          {
            customer,
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

      await session.commitTransaction();
      session.endSession();

      await clearProductCache();
      await clearCartCache(`cart:cartId:${cartId}`);

      return res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      await session.abortTransaction();
      session.endSession();
      return res
        .status(500)
        .json({ msg: error.message || "internal server error" });
    }
  },
  show: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      let order = await Order.findById(id).populate("customer");
      if (!order) {
        return res.status(404).json({ msg: "order not found" });
      }
      const enhancedOrders = orderService.enhanceProductImages(order);
      return res.json(enhancedOrders);
    } catch (error) {
      return res.status(500).json({ msg: "internal Server Error" });
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
    const { orderIds, shouldRestock } = req.body;

    // Validation
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return handler.handleResponse(res, {
        status: 400,
        message: "Invalid or empty orderIds array",
      });
    }

    const invalidIds = orderIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return handler.handleResponse(res, {
        status: 400,
        message: `Invalid order IDs: ${invalidIds.join(", ")}`,
      });
    }

    const session = await mongoose.startSession();

    try {
      let results;

      await session.withTransaction(async () => {
        results = await orderService.removeBulkOrders(orderIds, session);

        if (results.success.length === 0) {
          throw new Error("No orders could be deleted");
        }

        if (shouldRestock) {
          await orderService.restockBulkOrderItems(results.orders, session);
        }

        await clearProductCache();
      });

      session.endSession();

      return handler.handleResponse(res, {
        status: 200,
        message: `Successfully deleted ${results.success.length} orders. Failed: ${results.failed.length}.`,
        data: results,
      });
    } catch (error) {
      session.endSession();
      return handler.handleError(res, error);
    }
  },
  // Single order update
  update: async (req, res) => {
    const { id } = req.params;
    const {
      orderStatus,
      paymentStatus,
      fulfillmentStatus,
      shouldRestock,
      shouldDeduct,
    } = req.body;
    console.log("orderStatus", req.body.orderStatus);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handler.handleResponse(res, {
        status: 400,
        message: "Invalid id",
      });
    }

    const session = await mongoose.startSession();

    try {
      let updatedOrder;

      await session.withTransaction(async () => {
        const order = await orderService.getOrderById(id, session);
        if (!order) {
          throw new Error("Order not found");
        }

        // Handle inventory adjustments
        if (shouldRestock) {
          await orderService.restockOrderItems(order, session);
        }

        if (shouldDeduct) {
          await orderService.deductOrderItems(order, session);
        }

        // Update order
        updatedOrder = await orderService.updateOrder(
          id,
          {
            status: orderStatus,
            paymentStatus,
            fulfillmentStatus,
          },
          session
        );

        await clearProductCache();
      });

      session.endSession();

      return handler.handleResponse(res, {
        status: 200,
        message: "Order updated successfully.",
        data: updatedOrder,
      });
    } catch (error) {
      session.endSession();
      return handler.handleError(res, error);
    }
  },

  // Bulk order update
  bulkUpdate: async (req, res) => {
    const {
      orderIds,
      orderStatus,
      paymentStatus,
      fulfillmentStatus,
      shouldRestock,
      shouldDeduct,
    } = req.body;

    // Validation
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return handler.handleResponse(res, {
        status: 400,
        message: "Invalid or empty orderIds array",
      });
    }

    const invalidIds = orderIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return handler.handleResponse(res, {
        status: 400,
        message: `Invalid order IDs: ${invalidIds.join(", ")}`,
      });
    }

    const session = await mongoose.startSession();

    try {
      let results;

      await session.withTransaction(async () => {
        // Get all orders first
        const orders = await orderService.getOrdersByIds(orderIds, session);

        if (orders.length === 0) {
          throw new Error("No orders found");
        }

        // Handle inventory adjustments
        if (shouldRestock) {
          await orderService.restockBulkOrderItems(orders, session);
        }

        if (shouldDeduct) {
          await orderService.deductBulkOrderItems(orders, session);
        }

        // Update orders
        results = await orderService.updateBulkOrders(
          orderIds,
          {
            status: orderStatus,
            paymentStatus,
            fulfillmentStatus,
          },
          session
        );

        if (results.success.length === 0) {
          throw new Error("No orders could be updated");
        }

        await clearProductCache();
      });

      session.endSession();

      return handler.handleResponse(res, {
        status: 200,
        message: `Successfully updated ${results.success.length} orders. Failed: ${results.failed.length}.`,
        data: results,
      });
    } catch (error) {
      session.endSession();
      return handler.handleError(res, error);
    }
  },
  edit: async (req, res) => {
    const { id } = req.params;
    const {
      orderItemsfromDb,
      cleanedItems,
      shouldDeduct,
      shouldRestock,
      totalAmount,
      increaseQuantity,
      decreaseQuantity,
      removedItems,
      newItems,
    } = req.body;

    try {
      let finalItems = [];

      // Prepare bulk operations for inventory updates
      const bulkOps = [];

      // 1. Add new items and deduct inventory
      for (const item of newItems) {
        if (
          (shouldDeduct || item.trackQuantityEnabled) &&
          item.trackQuantityEnabled
        ) {
          bulkOps.push({
            updateOne: {
              filter: { _id: item._id, trackQuantityEnabled: true },
              update: { $inc: { "inventory.quantity": -item.quantity } },
            },
          });
        }
        finalItems.push(...orderItemsfromDb, item);
      }

      // 2. Handle increased quantities
      for (const item of increaseQuantity) {
        if (shouldDeduct && item.trackQuantityEnabled) {
          bulkOps.push({
            updateOne: {
              filter: { _id: item._id, trackQuantityEnabled: true },
              update: { $inc: { "inventory.quantity": -item.quantityDiff } },
            },
          });
        }
        finalItems.push(item.updatedItem); // item with updated quantity
      }

      // 3. Handle decreased quantities
      for (const item of decreaseQuantity) {
        if (shouldRestock && item.trackQuantityEnabled) {
          bulkOps.push({
            updateOne: {
              filter: { _id: item._id, trackQuantityEnabled: true },
              update: { $inc: { "inventory.quantity": item.quantityDiff } },
            },
          });
        }
        finalItems.push(item.updatedItem); // item with updated quantity
      }

      // 4. Handle removed items
      for (const item of removedItems) {
        if (shouldRestock && item.trackQuantityEnabled) {
          bulkOps.push({
            updateOne: {
              filter: { _id: item._id, trackQuantityEnabled: true },
              update: { $inc: { "inventory.quantity": item.quantity } },
            },
          });
        }
        // Don't push to finalItems
      }

      // Execute all inventory updates in one call
      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
      }

      console.log("finalItems", finalItems);

      // 5. Update order
      const sanitizedItems =
        removedItems.length > 0 ||
        increaseQuantity.length > 0 ||
        decreaseQuantity.length > 0
          ? cleanedItems.map(sanitizeOrderItem)
          : finalItems.map(sanitizeOrderItem);
      await Order.findByIdAndUpdate(id, {
        totalAmount,
        items: sanitizedItems,
      });
      await clearProductCache();
      return handler.handleResponse(res, {
        status: 200,
        message: "Order updated successfully.",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return handler.handleError(res, error);
    }
  },
};

module.exports = OrdersController;
