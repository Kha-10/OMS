const Customer = require("../models/Customer");

const updateCustomer = async (customerId, customerData, session, storeId) => {
  const existingCustomer = await Customer.findOne({
    _id: customerId,
    storeId: storeId,
  }).session(session);

  if (!existingCustomer) return null;

  existingCustomer.name = customerData.name;
  existingCustomer.email = customerData.email;
  existingCustomer.phone = customerData.phone;
  existingCustomer.deliveryAddress = customerData.deliveryAddress;

  await existingCustomer.save({ session });
  return existingCustomer;
};

module.exports = { updateCustomer };
