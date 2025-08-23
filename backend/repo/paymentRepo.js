const Payment = require("../models/Payment");

const recordPayment = async ({
  customerId = null,
  storeId,
  amount,
  type,
  method,
  session,
}) => {
  const payment = await Payment.create(
    [
      {
        customerId: customerId || null,
        storeId,
        amount,
        type,
        method,
      },
    ],
    { session }
  );
  return payment[0];
};

const findByStore = async (storeId, filter = {}, session) => {
  return Payment.find({ storeId, ...filter }).session(session || null);
};

const findByCustomer = (customerId, storeId, session) => {
  return Payment.find({ customerId, storeId }).session(session || null);
};

module.exports = {
  findByStore,
  findByCustomer,
  recordPayment,
};
