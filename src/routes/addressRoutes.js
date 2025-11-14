const express = require("express");
const addressController = require("../controllers/addressController");

const router = express.Router();

router.get("/", addressController.getAllAddresses);
router.get("/search", addressController.searchAddresses);
router.get("/latlon", addressController.getLatLon);

module.exports = router;
