const Customer = require("../models/Customer");

const buildQuery = (queryParams) => {
  let query = {};

  if (queryParams.search) {
    query.$or = [{ name: { $regex: queryParams.search, $options: "i" } }];
  }

  return query;
};

const buildSort = (sortBy, sortDirection) => {
  const direction = sortDirection === "asc" ? 1 : -1;
  return sortBy === "totalSpent"
    ? { totalSpent: direction }
    : { createdAt: direction };
};

const fetchCustomersFromDB = async (queryParams) => {
  const query = buildQuery(queryParams);
  if (queryParams.storeId) {
    query.storeId = queryParams.storeId;
  }
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const [customers, totalCustomers] = await Promise.all([
    Customer.find(query).sort(sort).skip(skip).limit(limit),
    Customer.countDocuments(query),
  ]);

  return { customers, totalCustomers, page, limit };
};

const updateCustomer = async (
  customerId,
  customerData,
  storeId,
  session = null,
) => {
  let query = Customer.findOne({ _id: customerId, storeId });
  if (session) query = query.session(session);

  const existingCustomer = await query;
  if (!existingCustomer) return null;

  // Update fields
  existingCustomer.name = customerData.name;
  existingCustomer.email = customerData.email;
  existingCustomer.phone = customerData.phone;
  existingCustomer.deliveryAddress = customerData.deliveryAddress;

  // Save with session if provided
  if (session) {
    await existingCustomer.save({ session });
  } else {
    await existingCustomer.save();
  }

  return existingCustomer;
};

module.exports = {
  updateCustomer,
};

const findById = async (id, storeId, session = null) => {
  const query = Customer.findOne({ _id: id, storeId }).lean();
  if (session) query.session(session);
  return query;
};

const findByPhone = async (phone, storeId) => {
  return Customer.findOne({ phone, storeId });
};

const createCustomer = async (customerData, storeId, session) => {
  const customer = new Customer({
    ...customerData,
    storeId,
    totalSpent: 0,
  });

  if (session) {
    await customer.save({ session });
  } else {
    await customer.save();
  }

  return customer;
};

const deleteMany = async (ids, storeId) => {
  const result = await Customer.deleteMany({ _id: { $in: ids }, storeId });
  return result.deletedCount;
};

const findInvalidIds = async (ids, storeId) => {
  const validIds = (await Customer.find({ _id: { $in: ids }, storeId })).map(
    (c) => c._id.toString()
  );
  return ids.filter((id) => !validIds.includes(id));
};

const refundCustomer = async (customerId, amount, session, storeId) => {
  return Customer.bulkWrite(
    [
      {
        updateOne: {
          filter: { _id: customerId, storeId },
          update: { $inc: { totalSpent: -amount } },
        },
      },
    ],
    { session }
  );
};

const addPayment = async (customerId, amount, session, storeId) => {
  return Customer.bulkWrite(
    [
      {
        updateOne: {
          filter: { _id: customerId, storeId },
          update: { $inc: { totalSpent: amount } },
        },
      },
    ],
    { session }
  );
};

module.exports = {
  fetchCustomersFromDB,
  findById,
  findByPhone,
  createCustomer,
  deleteMany,
  findInvalidIds,
  updateCustomer,
  refundCustomer,
  addPayment,
};
