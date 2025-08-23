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
    customerData.phone,
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

    await CustomerRepo.addRefund(customerId, amount, session, storeId);
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
  deleteCustomers,
  refund,
  pay,
};
