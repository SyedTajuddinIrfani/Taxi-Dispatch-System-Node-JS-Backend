const express = require("express");
const router = express.Router();
const multer = require("multer");
const controller = require("../controllers/fareConfigurationController");

// ✅ Multer instance to parse form-data (even without files)
const upload = multer();

router.post("/add", upload.any(), controller.createFareConfiguration);
router.get("/get", controller.getAllFareConfigurations);
router.get("/getbyid/:id", controller.getFareConfigurationById);
router.post("/edit/:id", upload.none(), controller.updateFareConfiguration);
router.delete("/delete/:id", controller.deleteFareConfiguration);

module.exports = router;
