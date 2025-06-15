const mongoose = require("mongoose");
const Customer = require("../models/Customer");

const buildQuery = (queryParams) => {
  let query = {};

  if (queryParams.search) {
    query.$or = [
      { name: { $regex: queryParams.search, $options: "i" } },
      // { phoneNumber: { $regex: queryParams.search, $options: "i" } },
    ];
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

const findCustomers = async (queryParams) => {
  let categoriesData = await fetchCustomersFromDB(queryParams);

  return categoriesData;
};

// Delete
const deleteCustomers = async (ids) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { deletedCount: 0, invalidIds };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customers = await Customer.find({ _id: { $in: ids } }).session(
      session
    );

    if (customers.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return { deletedCount: 0, invalidIds: [] };
    }

    await Customer.deleteMany({ _id: { $in: ids } }).session(session);

    // await Promise.all([
    //   Category.updateMany(
    //     { products: { $in: ids } },
    //     { $pull: { products: { $in: ids } } }
    //   ).session(session),

    //   Order.updateMany(
    //     { "items.productId": { $in: ids } },
    //     {
    //       $set: {
    //         "items.$[elem].productId": null,
    //         "items.$[elem]._id": null,
    //       },
    //     },
    //     {
    //       arrayFilters: [{ "elem.productId": { $in: ids } }],
    //       session,
    //     }
    //   ),
    // ]);

    await session.commitTransaction();
    session.endSession();

    return {
      deletedCount: customers.length,
      invalidIds: [],
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  findCustomers,
  deleteCustomers,
};
