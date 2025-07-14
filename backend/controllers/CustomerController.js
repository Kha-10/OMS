const Customer = require("../models/Customer");
const mongoose = require("mongoose");
const customerService = require("../services/customerService");
const handler = require("../helpers/handler");
const clearProductCache = require("../helpers/clearProductCache");

const Customercontroller = {
  index: async (req, res) => {
    try {
      const queryParams = req.query;
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
    const { name, phone, email, deliveryAddress } = req.body;
    console.log("req.body", req.body);
    try {
      const existingCustomer = await Customer.findOne({ phone });

      if (existingCustomer) {
        return res.status(409).json({ msg: "Customer already exists" });
      }

      const customer = await Customer.create({
        name,
        phone,
        email,
        deliveryAddress,
      });
      return res.json(customer);
    } catch (error) {
      console.error("Error creating category:", error);
      return res.status(500).json({ msg: "internet server error" });
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
};

module.exports = Customercontroller;
