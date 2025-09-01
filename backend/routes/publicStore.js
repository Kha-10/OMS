const express = require("express");
const StoreController = require("../controllers/StoreController");

const router = express.Router({ mergeParams: true });

router.get("", StoreController.show);


module.exports = router;