const express = require("express");
const router = express.Router();
const fixedFareController = require("../controllers/fixedFareController");

router.post("/add", fixedFareController.createFixedFares);
router.get("/get", fixedFareController.getAllFixedFares);
router.get("/getbyid/:id", fixedFareController.getFixedFareById);
router.post("/edit/:id", fixedFareController.updateFixedFare);
router.delete("/delete/:id", fixedFareController.deleteFixedFare);

module.exports = router;
