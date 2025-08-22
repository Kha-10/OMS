const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const clearProductCache = require("../helpers/clearProductCache");
const clearCartCache = require("../helpers/clearCartCache");
const clearCache = require("../helpers/clearCache");
const uploadAdapter = require("./adapters/index");
const OrderRepo = require("../repo/orderRepo");
const ProductRepo = require("../repo/productRepo");
const CounterRepo = require("../repo/counterRepo");
const CustomerRepo = require("../repo/customerRepo");
const CartRepo = require("../repo/cartRepo");
const redisClient = require("../config/redisClient");

// GET

const findOrders = async (queryParams) => {
  const orderData = await OrderRepo.fetchOrders(queryParams);

  orderData.orders = enhanceProductImages(orderData.orders);

  return orderData;
};

const enhanceProductImages = (input) => {
  if (!input) return input;
  if (Array.isArray(input)) {
    return input.map((product) => uploadAdapter.getImageUrls(product));
  }
  return uploadAdapter.getImageUrls(input);
};

const createOrder = async ({
  customer,
  cartId,
  items,
  notes,
  orderStatus,
  pricing,
  idempotencyKey,
  storeId,
  createdBy,
}) => {
  const cartLockKey = `lock:storeId:${storeId}cart:${cartId}`;
  const isLocked = await redisClient.get(cartLockKey);

  if (isLocked) {
    throw new Error("Cart is currently being processed");
  }

  // Lock the cart for 30 seconds
  await redisClient.set(cartLockKey, "locked", { ex: 30 });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Handle customer reference
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
      throw new Error("Customer info is required.");
    }

    // Generate sequential order + invoice numbers
    const orderNumber = await CounterRepo.getNext(
      "orderNumber",
      storeId,
      createdBy
    );
    const invoiceNumber = await CounterRepo.getNext(
      "invoiceNumber",
      storeId,
      createdBy
    );

    // Validate inventory + decrement stock
    for (const item of items) {
      await ProductRepo.validateAndDecrementInventory(item, session, storeId);
    }

    // Update existing customer if needed
    if (customerId) {
      await CustomerRepo.updateCustomer(customerId, customer, session, storeId);
    }

    const order = await OrderRepo.createOrder(
      {
        customer: customerId,
        manualCustomer,
        items,
        notes,
        orderStatus,
        pricing,
        orderNumber,
        invoiceNumber,
        storeId,
        createdBy,
      },
      session
    );

    // Save idempotency success marker
    await redisClient.set(
      `storeId${storeId}idemp:${idempotencyKey}}`,
      JSON.stringify({ status: "completed", orderId: order._id }),
      { ex: 3600 }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    await clearCache(storeId, "products");
    await clearCartCache(`cart:storeId:${storeId}cartId:${cartId}`);
    await redisClient.del(cartLockKey);

    return order;
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();

    // Save idempotency failure marker
    await redisClient.set(
      `storeId${storeId}idemp:${idempotencyKey}`,
      JSON.stringify({ status: "failed", error: error.message }),
      { ex: 600 }
    );

    await redisClient.del(cartLockKey);

    throw error;
  }
};
const getOrderWithEnhancedItems = async (orderId, storeId) => {
  const order = await OrderRepo.findById(orderId, storeId);
  if (!order) return null;

  const updatedItems = await Promise.all(
    order.items.map(async (item) => {
      const latestProduct = await OrderRepo.findProductById(
        item.productId,
        storeId
      );
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
  await OrderRepo.saveOrder(order);

  // use your existing helper for image formatting
  return enhanceProductImages(order);
};

const loadOrderAsCart = async (orderId, storeId) => {
  const order = await OrderRepo.findById(orderId, storeId);
  if (!order) return null;

  // Refresh product data for items
  const updatedItems = await Promise.all(
    order.items.map(async (item) => {
      const latestProduct = await OrderRepo.findProductById(
        item.productId,
        storeId
      );
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
  await OrderRepo.saveOrder(order);

  const cartId = order._id;
  const cartKey = `cart:store:${storeId}:cartId:${cartId}`;

  const cart = {
    id: cartId,
    order,
    createdAt: Date.now(),
  };
  console.log("cartKey",cartKey);
  await redisClient.set(cartKey, JSON.stringify(cart), { EX: 86400 });

  return cart;
};

// Delete
const removeOrder = async (orderId, session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    return null;
  }

  // await Order.findByIdAndDelete(orderId).session(session);
  await Order.deleteOne({ _id: orderId }).session(session);
  return order;
};

// Remove multiple orders
const removeBulkOrders = async (orderIds, session) => {
  const orders = await Order.find({ _id: { $in: orderIds } }).session(session);
  const result = await Order.deleteMany({ _id: { $in: orderIds } }).session(
    session
  );
  const foundIds = orders.map((o) => o._id.toString());
  const success = foundIds;
  const failed = orderIds
    .filter((id) => !foundIds.includes(id.toString()))
    .map((id) => ({ id, reason: "Order not found" }));
  return { success, failed, orders };
};

module.exports = {
  findOrders,
  enhanceProductImages,
  getOrderWithEnhancedItems,
  createOrder,
  loadOrderAsCart,
  removeOrder,
  removeBulkOrders,
};
