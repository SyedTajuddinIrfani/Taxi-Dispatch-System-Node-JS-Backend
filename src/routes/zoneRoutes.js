const express = require("express");
const router = express.Router();
const zoneController = require("../controllers/zoneController");

router.post("/", zoneController.createZone);
router.get("/get", zoneController.getAllZones);
router.get("/getbyid/:id", zoneController.getZoneById);
router.post("/edit/:id", zoneController.updateZone);
router.delete("/delete/:id", zoneController.deleteZone);

module.exports = router;
