const express = require("express");
const StoreController = require("../controllers/StoreController");
const ProductsController = require("../controllers/ProductsController");

const router = express.Router({ mergeParams: true });

router.get("", StoreController.show);

router.get("/", ProductsController.index);

module.exports = router;