const Counter = require("../models/Counter");

const resetCounters = async () => {
  try {
    // Reset the orderNumber counter to 1
    await Counter.findOneAndUpdate(
      { id: "orderNumber" }, // Find the orderNumber counter
      { $set: { seq: 1 } }, // Set the seq value to 1
      { new: true, upsert: true } // Create if it doesn't exist
    );

    // Reset the invoiceNumber counter to 1
    await Counter.findOneAndUpdate(
      { id: "invoiceNumber" }, // Find the invoiceNumber counter
      { $set: { seq: 1 } }, // Set the seq value to 1
      { new: true, upsert: true } // Create if it doesn't exist
    );

  } catch (error) {
    console.error("Error resetting counters:", error);
  }
};

module.exports = resetCounters ;