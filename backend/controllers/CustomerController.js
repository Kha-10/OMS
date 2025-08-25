const Customer = require("../models/Customer");
const mongoose = require("mongoose");
const customerService = require("../services/customerService");
const handler = require("../helpers/handler");
const clearProductCache = require("../helpers/clearProductCache");

const Customercontroller = {
  index: async (req, res) => {
    try {
      const queryParams = {
        ...req.query,
        storeId: req.storeId,
      };
      let { customers, totalCustomers, page, limit } =
        await customerService.findCustomers(queryParams);

      if (!Array.isArray(customers)) {
        customers = [];
      }
      const response = {
        data: customers,
        pagination: {
          totalCustomers,
          totalPages: Math.ceil(totalCustomers / limit),
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < Math.ceil(totalCustomers / limit),
          hasPreviousPage: page > 1,
        },
      };
      console.log("response", response);
      return res.json(response);
    } catch (error) {
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  store: async (req, res) => {
    console.log("HITTTTT");
    const { name, phone, email, deliveryAddress } = req.body;
    const storeId = req.storeId;

    if (!storeId) {
      throw handler.notFoundError("StoreId is required");
    }

    try {
      const customer = await customerService.storeCustomer(
        {name, phone, email, deliveryAddress },
        storeId
      );

      return res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";
      return res.status(status).json({ msg: message });
    }
  },
  show: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }

      let customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ msg: "Customer not found" });
      }
      return res.json(customer);
    } catch (error) {
      console.log("err", error);
      return res.status(500).json({ msg: "Internet Server Error" });
    }
  },
  destroy: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await customerService.deleteCustomers([id]);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({ msg: "Invalid customer ID" });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "Customer not found" });
      }

      return res.json({ msg: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error in destroy:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  bulkDestroy: async (req, res) => {
    try {
      const { ids } = req.body;

      const result = await customerService.deleteCustomers(ids);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({
          msg: "Some IDs are invalid",
          invalidIds: result.invalidIds,
        });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "No Customers found" });
      }

      return res.json({
        msg: "Customers deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error in bulkDestroy:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  update: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      let customer = await Customer.findByIdAndUpdate(id, {
        ...req.body,
      });
      if (!customer) {
        return res.status(404).json({ msg: "Customer not found" });
      }
      return res.json(customer);
    } catch (error) {
      return res.status(500).json({ msg: "Internet Server Error" });
    }
  },
  refund: async (req, res) => {
    const { customer, pricing, manualCustomer } = req.body;
    const storeId = req.storeId;
    let customerId = customer?._id || manualCustomer._id;
    const totalSpent = pricing?.finalTotal;

    if (!storeId) {
      throw handler.invalidError("StoreId is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await customerService.refund(customerId, totalSpent, storeId, session);

      await session.commitTransaction();
      session.endSession();

      return res.json({ msg: "Refund processed successfully" });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  pay: async (req, res) => {
    const { customer, pricing, manualCustomer } = req.body;
    const storeId = req.storeId;
    let customerId = customer?._id || manualCustomer._id;
    const totalSpent = pricing?.finalTotal;

    if (!storeId) {
      throw handler.invalidError("StoreId is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await customerService.pay(customerId, totalSpent, storeId, session);

      await session.commitTransaction();
      session.endSession();

      return res.json("Payment processed successfully");
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
};

module.exports = Customercontroller;
