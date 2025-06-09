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

module.exports = {
  findCustomers,
};
