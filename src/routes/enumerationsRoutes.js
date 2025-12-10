const express = require("express");
const router = express.Router();
const enumerationsController = require("../controllers/enumerationsController");

router.get("/get", enumerationsController.getAllEnumerations);

module.exports = router;
