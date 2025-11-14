// routes/combinedRoutes.js
const express = require("express");
const router = express.Router();
const combinedController = require("../controllers/combinedPlotFareListController");

router.get("/zone-vehicle-types", combinedController.getVehicleTypeAndZones);

module.exports = router;
