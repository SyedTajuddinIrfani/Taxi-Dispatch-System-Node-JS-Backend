// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/bookingController");

router.post("/add", ctrl.createBooking);
router.get("/get", ctrl.getBookingSections);
module.exports = router;
