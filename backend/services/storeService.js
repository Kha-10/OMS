const storeRepo = require("../repo/storeRepo");
const storeMembershipRepo = require("../repo/storeMembershipRepo");
const User = require("../models/User");
const mongoose = require("mongoose");

const validateId = (storeId) => {
  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    throw new Error("Invalid store ID");
  }
  return storeId;
};

const getStoreByUserId = async (userId) => {
  const validatedUserId = validateId(userId);
  const memberships = await storeMembershipRepo.findByUserId(validatedUserId);
  const stores = memberships.map((m) => ({
    _id: m.store._id,
    name: m.store.name,
  }));
  return stores;
};

const updatePaymentSettings = async (storeId, userId, storeData) => {
  const validatedStoreId = validateId(storeId);
  const existingStore = await storeRepo.findByStoreId(validatedStoreId);
  if (!existingStore) throw new Error("Store not found");

  const store = await storeRepo.update(validatedStoreId, {
    "settings.payments": {
      cash: storeData.cash,
      bank: {
        enabled: storeData.bank,
        bankName: storeData.bankName,
        accountNumber: storeData.accountNumber,
        accountHolderName: storeData.accountHolderName,
      },
      promptPay: {
        enabled: storeData.qr,
        countryCode: storeData.countryCode,
        phoneNumber: storeData.phoneLocal,
      },
    },
  });
  await User.findByIdAndUpdate(userId, { onboarding_step: 6 });

  return store;
};

module.exports = {
  getStoreByUserId,
  updatePaymentSettings,
};
