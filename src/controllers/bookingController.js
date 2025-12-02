// controllers/bookingController.js
const bookingService = require('../services/bookingService');

exports.createBooking = async (req, res) => {
  try {
    console.log(
      "🚀 INCOMING DRIVER ADD BODY:",
      JSON.stringify(req.body, null, 2)
    );
    const payload = req.body;
    // The real system sometimes sends top-level "booking" array; we accept both shapes.
    const result = await bookingService.create(payload);
    // Format response to match your examples:
    // - main array property name "booking"
    // - optionally "return_booking"
    return res.json({ status: true, ...result });
  } catch (err) {
    console.error('createBooking error', err);
    res.status(500).json({ status: false, error: err.message || 'Internal error' });
  }
};
