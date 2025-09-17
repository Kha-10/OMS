const mongoose = require("mongoose");
const Order = require("../models/Order");
const Store = require("../models/Store");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const clearProductCache = require("../helpers/clearProductCache");
const clearCartCache = require("../helpers/clearCart");
const clearCache = require("../helpers/clearCache");
const uploadAdapter = require("./adapters/index");
const OrderRepo = require("../repo/orderRepo");
const ProductRepo = require("../repo/productRepo");
const CounterRepo = require("../repo/counterRepo");
const CustomerRepo = require("../repo/customerRepo");
const CartRepo = require("../repo/cartRepo");
const redisClient = require("../config/redisClient");
const handler = require("../helpers/handler");
const Queue = require("bull");
const IORedis = require("ioredis");
const {
  buildItemsHtml,
  sendOrderTemplateEmail,
  formatWithCurrency,
} = require("../helpers/sendOrderEmail");

const connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
const orderDeliveryQueue = new Queue("orderDeliveryQueue", {
  createClient: function (type) {
    console.log("type", type);
    switch (type) {
      case "client":
        return connection;
      case "subscriber":
        return connection.duplicate();
      default:
        return connection.duplicate();
    }
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 50,
    removeOnFail: 10,
  },
});

orderDeliveryQueue.process(async function (job, done) {
  try {
    const { fromEmail, fromName, templateId, variables, email, name, subject } =
      job.data;
    if (!fromEmail) throw new Error("fromEmail is required but missing");
    if (!fromName) throw new Error("fromName is required but missing");
    if (!email) throw new Error("Email is required but missing");
    if (!name) throw new Error("Name is required but missing");
    if (!templateId) throw new Error("TemplateId is required but missing");

    await sendOrderTemplateEmail(
      fromEmail,
      fromName,
      templateId,
      variables,
      email,
      name,
      subject
    );

    done();
  } catch (error) {
    console.error("Error processing email job:", job.id, error);
    done(error);
  }
});

// GET

const findOrders = async (queryParams) => {
  const orderData = await OrderRepo.fetchOrders(queryParams);

  orderData.orders = enhanceProductImages(orderData.orders);

  return orderData;
};

const enhanceProductImages = (input) => {
  if (!input) return input;
  if (Array.isArray(input)) {
    return input.map((order) => uploadAdapter.getImageUrls(order));
  }
  return uploadAdapter.getImageUrls(input, "orders");
};

const createOrder = async ({
  customer,
  customerType,
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
      await CustomerRepo.updateCustomer(customerId, customer, storeId, session);
    }
    const soldOutItems = items.filter(
      (item) => item.quantity > item.productinventory
    );

    if (soldOutItems.length > 0) {
      const productNames = soldOutItems
        .map((item) => item.productName)
        .join(", ");
      throw handler.insufficient(`Sold out for products: ${productNames}`);
    }

    const order = await OrderRepo.createOrder(
      {
        customer: customerId,
        manualCustomer,
        customerType,
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
    // await clearProductCache(storeId)
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
        productName: latestProduct.name,
        // productinventory: item.quantity + latestProduct.inventory.quantity,
        ...(latestProduct.trackQuantityEnabled && {
          productinventory:
            item.quantity + (latestProduct.inventory?.quantity ?? 0),
        }),
        cartMinimum: latestProduct.cartMinimumEnabled
          ? latestProduct.cartMinimum
          : 0,
        cartMaximum: latestProduct.cartMaximumEnabled
          ? latestProduct.cartMaximum
          : 0,
        imgUrls: latestProduct.imgUrls || [],
        photo: latestProduct.photo || [],
        categories: latestProduct.categories || [],
      };
    })
  );

  const enhancedOrder = {
    ...order.toObject(),
    items: updatedItems,
  };

  // Use your existing helper for image formatting
  return enhanceProductImages(enhancedOrder);
};

const loadOrderAsCart = async (orderId, storeId) => {
  const order = await OrderRepo.findById(orderId, storeId);
  if (!order) return null;

  // Enhance items without overwriting historical data
  const enhancedItems = await Promise.all(
    order.items.map(async (item) => {
      const latestProduct = await OrderRepo.findProductById(
        item.productId,
        storeId
      );

      if (!latestProduct) return item;

      return {
        ...item.toObject(),
        currentProductInfo: {
          trackQuantityEnabled: latestProduct.trackQuantityEnabled,
          inventory: latestProduct.inventory.quantity,
          cartMinimum: latestProduct.cartMinimumEnabled
            ? latestProduct.cartMinimum
            : 0,
          cartMaximum: latestProduct.cartMaximumEnabled
            ? latestProduct.cartMaximum
            : 0,
          imgUrls: latestProduct.imgUrls || [],
          photo: latestProduct.photo || [],
          categories: latestProduct.categories || [],
        },
      };
    })
  );

  const cartId = order._id;

  const cartKey = `cart:storeId:${storeId}cartId:${cartId}`;

  const cart = {
    id: cartId,
    order: {
      ...order.toObject(),
      items: enhancedItems,
    },
    createdAt: Date.now(),
  };

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
    // await clearProductCache(storeId)
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
  // await clearProductCache(storeId)
  return order;
};

const restockOrder = async (orderId, storeId, session) => {
  const order = await OrderRepo.findById(orderId, storeId, session);
  console.log("restockOrder", order);
  if (!order) return null;

  await OrderRepo.restockOrderItems(order, session);
  await clearCache(storeId, "products");
  // await clearProductCache(storeId)

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

    await ProductRepo.bulkDeductInventory(
      originalOrder.items,
      session,
      storeId
    );

    await clearCache(storeId, "products");
    // await clearProductCache(storeId)

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const bulkUpdate = async (orderIds, updateData, storeId, session) => {
  const orders = await OrderRepo.findOrdersByIds(orderIds, storeId, session);

  if (!orders || orders.length === 0) {
    throw new Error("No orders found");
  }

  const storeData = await Store.findById(storeId);
  if (updateData.orderStatus || updateData.fulfillmentStatus) {
    for (const order of orders) {
      const email = order.customer?.email || order.manualCustomer?.email;
      const name = order.customer?.name || order.manualCustomer?.name;
      if (!email || !name) continue; // skip invalid orders

      const variables = {
        username: name,
        orderNumber: order._id,
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

      let templateId;
      let subject;

      if (updateData.orderStatus === "Confirmed") {
        templateId = 7318118;
        subject = "Order Confirmation";
      } else if (updateData.fulfillmentStatus === "Fulfilled") {
        templateId = 7314492;
        subject = "Order Delivered";
      } else {
        continue; // ignore other statuses
      }

      await orderDeliveryQueue.add(
        {
          fromEmail: storeData.email,
          fromName: storeData.name,
          templateId,
          variables,
          email,
          name,
          subject,
        },
        {
          delay: 0,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        }
      );
    }
  }

  await OrderRepo.bulkUpdate(orderIds, updateData, session, storeId);
  return true;
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
  bulkUpdate,
};
