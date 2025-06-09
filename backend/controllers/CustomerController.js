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

      return handler.handleResponse(res, { status: 200, message: response });
    } catch (error) {
      return handler.handleError(res, error);
    }
  },
  store: async (req, res) => {
    const { name, phoneNumber, address,condoName,condoUnit } = req.body;

    try {
      const existingCustomer = await Customer.findOne({ phoneNumber });

      if (existingCustomer) {
        return handler.handleError(res, {
          status: 409,
          message: "Customer already exists",
        });
      }

      const customer = await Customer.create({
        name,
        phoneNumber,
        address,
        condoName,
        condoUnit
      });
      return res.json(customer);
    } catch (error) {
      console.error("Error creating category:", error);
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server error",
      });
    }
  },
  show: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return handler.handleError(res, {
          status: 400,
          message: "Invalid id",
        });
      }

      let customer = await Customer.findById(id);
      if (!customer) {
        return handler.handleError(res, {
          status: 404,
          message: "Customer not found",
        });
      }
      return res.json(customer);
    } catch (error) {
      console.log("err", error);
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server Error",
      });
    }
  },
  destroy: async (req, res) => {
    try {
      let id = req.params.id;
      console.log("GGG", id);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return handler.handleError(res, {
          status: 400,
          message: "Invalid id",
        });
      }
      let customer = await Customer.findByIdAndDelete(id);
      if (!customer) {
        return handler.handleError(res, {
          status: 404,
          message: "Customer not found",
        });
      }
      return res.json(customer);
    } catch (error) {
      console.log("err", error);
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server Error",
      });
    }
  },
  update: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return handler.handleError(res, {
          status: 400,
          message: "Invalid id",
        });
      }
      let customer = await Customer.findByIdAndUpdate(id, {
        ...req.body,
      });
      if (!customer) {
        return handler.handleError(res, {
          status: 404,
          message: "Customer not found",
        });
      }
      return res.json(customer);
    } catch (error) {
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server Error",
      });
    }
  },
};

module.exports = Customercontroller;
