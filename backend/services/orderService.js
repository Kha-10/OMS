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
const handler = require("../helpers/handler");

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
    throw handler.lockError("Cart is currently being processed");
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
      throw handler.invalidError("Customer info is required.");
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
  const cartKey = `cart:storeId:${storeId}cartId:${cartId}`;

  const cart = {
    id: cartId,
    order,
    createdAt: Date.now(),
  };
  console.log("cartKey", cartKey);
  await redisClient.set(cartKey, JSON.stringify(cart), { EX: 86400 });

  return cart;
};

const editSingleOrder = async (id, storeId, payload) => {
  const { customer, items, notes, orderStatus, pricing } = payload;

  // 1. Find Order
  const order = await OrderRepo.findById(id, storeId);
  if (!order) throw handler.notFoundError("Order not found");

  // 2. Handle Customer
  let customerId = null;
  let manualCustomer = null;

  if (customer?.customerId) {
    customerId = customer.customerId;
  } else {
    manualCustomer = {
      name: customer?.name?.trim() || "",
      phone: customer?.phone?.trim() || "",
      email: customer?.email,
      deliveryAddress: customer?.deliveryAddress,
    };
  }

  if (!customerId && !manualCustomer) {
    throw handler.invalidError("Customer info is required.");
  }

  if (customerId) {
    const existingCustomer = await OrderRepo.findCustomerById(
      customerId,
      storeId
    );
    if (existingCustomer) {
      existingCustomer.name = customer.name;
      existingCustomer.email = customer.email;
      existingCustomer.phone = customer.phone;
      existingCustomer.deliveryAddress = customer.deliveryAddress;
      await OrderRepo.saveCustomer(existingCustomer);
    }
  }

  // 3. Check Restock Logic
  const originalItems = order.items;
  let needRestockAndDeduct = originalItems.some((i) => i.trackQuantityEnabled);

  // 4. Update Order
  if (!needRestockAndDeduct) {
    await OrderRepo.updateOrder(id, storeId, {
      customer: customerId,
      manualCustomer,
      items,
      notes,
      orderStatus,
      pricing,
    });
  }

  return { needRestockAndDeduct };
};

const updateOrderService = async (
  orderId,
  storeId,
  newItems,
  notes,
  pricing
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get original order
    const originalOrder = await OrderRepo.findById(orderId, storeId, session);
    if (!originalOrder) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, msg: "Order not found" };
    }

    // 2. Restore old quantities
    for (const item of originalOrder.items) {
      await OrderRepo.restoreProductQuantity(
        item.productId,
        item.quantity,
        storeId,
        session
      );
    }

    // 3. Deduct new quantities
    for (const item of newItems) {
      await OrderRepo.deductProductQuantity(
        item.productId,
        item.quantity,
        storeId,
        session
      );
    }

    // 4. Update order
    await OrderRepo.updateOrder(
      orderId,
      storeId,
      { items: newItems, notes, pricing },
      session
    );

    await clearCache(storeId, "products");
    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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

const removeOrder = async (orderId, storeId, session) => {
  return OrderRepo.removeOrder(orderId, storeId, session);
};

const restockOrderItems = async (order, storeId, session) => {
  for (const item of order.items) {
    await ProductRepo.restoreProductQuantity(
      item.product,
      item.quantity,
      storeId,
      session
    );
  }
};

const deleteOrder = async (orderId, storeId, shouldRestock, session) => {
  const order = await removeOrder(orderId, storeId, session);

  if (!order) {
    throw handler.notFoundError("Order not found");
  }

  if (shouldRestock) {
    await restockOrderItems(order, storeId, session);
  }

  await clearCache(storeId, "products");
  return order;
};

const restockOrder = async (orderId, storeId, session) => {
  const order = await OrderRepo.findById(orderId, storeId, session);

  if (!order) return null;

  await OrderRepo.restockOrderItems(order, session);
  await clearCache(storeId, "products");

  return order;
};

const bulkDestroyOrders = async (orderIds, storeId) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw handler.invalidError("empty orderIds");
  }

  const invalidIds = orderIds.filter(
    (id) => !mongoose.Types.ObjectId.isValid(id)
  );
  if (invalidIds.length > 0) {
    throw handler.invalidError(`Invalid order IDs: ${invalidIds.join(", ")}`);
  }

  const session = await mongoose.startSession();
  try {
    let deletedCount = 0;

    await session.withTransaction(async () => {
      const orders = await OrderRepo.findOrdersByIds(
        orderIds,
        storeId,
        session
      );

      if (orders.length === 0) {
        throw handler.notFoundError("No orders found");
      }

      const result = await OrderRepo.bulkDeleteOrders(
        orderIds,
        storeId,
        session
      );
      deletedCount = result.deletedCount || 0;
    });

    session.endSession();
    return { deletedCount };
  } catch (err) {
    session.endSession();
    throw err;
  }
};

const deduct = async (orderId, storeId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalOrder = await OrderRepo.findById(orderId, storeId, session);

    if (!originalOrder) {
      await session.abortTransaction();
      session.endSession();
      throw handler.notFoundError("Order not found");
    }

    await ProductRepo.bulkDeductInventory(originalOrder.items, session);

    await clearProductCache();

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  findOrders,
  enhanceProductImages,
  getOrderWithEnhancedItems,
  createOrder,
  loadOrderAsCart,
  removeOrder,
  removeBulkOrders,
  editSingleOrder,
  updateOrderService,
  deleteOrder,
  restockOrder,
  bulkDestroyOrders,
  deduct,
};
