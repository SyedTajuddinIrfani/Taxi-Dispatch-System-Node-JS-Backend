// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingController');

router.post('/add', ctrl.createBooking);

module.exports = router;
