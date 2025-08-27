const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const CustomerRepo = require("../repo/customerRepo");
const PaymentRepo = require("../repo/paymentRepo");
const handler = require("../helpers/handler");

const findCustomers = async (queryParams) => {
  let customerData = await CustomerRepo.fetchCustomersFromDB(queryParams);

  return customerData;
};

const storeCustomer = async (customerData, storeId, session = null) => {
  const existingCustomer = await CustomerRepo.findByPhone(
    // customerData.phone,
    storeId
  );

  if (existingCustomer) {
    throw handler.conflictError("Customer already exists");
  }

  const customer = await CustomerRepo.createCustomer(
    customerData,
    storeId,
    session
  );
  return customer;
};

const updateCustomer = async (id, updateData, storeId) => {
  const customer = await CustomerRepo.updateCustomer(id, updateData, storeId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
};


// Delete
const deleteCustomers = async (ids, storeId) => {
  const invalidIds = await CustomerRepo.findInvalidIds(ids, storeId);

  if (invalidIds.length > 0) {
    return { invalidIds, deletedCount: 0 };
  }

  const deletedCount = await CustomerRepo.deleteMany(ids, storeId);

  return { invalidIds: [], deletedCount };
};

const pay = async (
  customerId,
  totalSpent,
  storeId,
  session,
  method = "cash"
) => {
  if (customerId) {
    const customer = await CustomerRepo.findById(customerId, storeId);
    if (!customer) throw new Error("Customer not found");

    await CustomerRepo.addPayment(customerId, totalSpent, session, storeId);
  }

  await PaymentRepo.recordPayment({
    customerId,
    storeId,
    amount: totalSpent,
    type: "PAYMENT",
    method,
    session,
  });

  return true;
};

const refund = async (
  customerId,
  amount,
  storeId,
  session,
  method = "cash"
) => {
  if (customerId) {
    const customer = await CustomerRepo.findById(customerId, storeId);
    if (!customer) throw new Error("Customer not found");

    await CustomerRepo.refundCustomer(customerId, amount, session, storeId);
  }

  // Always record refund
  await PaymentRepo.recordPayment({
    customerId,
    storeId,
    amount,
    type: "REFUND",
    method,
    session,
  });

  return true;
};

module.exports = {
  findCustomers,
  storeCustomer,
  updateCustomer,
  deleteCustomers,
  refund,
  pay,
};
