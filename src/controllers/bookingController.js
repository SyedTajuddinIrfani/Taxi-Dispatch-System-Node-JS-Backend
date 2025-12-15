const bookingService = require("../services/bookingService");
const {
  getTodayBookings,
  getAllBookings,
  getRecentBookings,
  getCompletedBookings,
  getWebBookings,
  getQuotedBookings,
  getIvrBookings,
  getAppBookings,
  getPreBookings,
} = require("../models/bookingModel");

function parseJSONFields(row) {
  if (!row) return row;

  const jsonFields = [
    "viapoints",
    "restricted_drivers",
    "notes",
    "child_seat",
    "skipped_bookings",
  ];

  const parsed = { ...row };

  jsonFields.forEach((field) => {
    if (parsed[field] && typeof parsed[field] === "string") {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        console.log(`JSON parse failed for field: ${field}`);
      }
    }
  });

  return parsed;
}

exports.createBooking = async (req, res) => {
  try {
    console.log(
      "🚀 INCOMING DRIVER ADD BODY:",
      JSON.stringify(req.body, null, 2)
    );

    const payload = req.body;
    const result = await bookingService.create(payload);

    // Parse JSON fields inside results before sending
    if (result.booking) {
      result.booking = result.booking.map(parseJSONFields);
    }
    if (result.return_booking) {
      result.return_booking = result.return_booking.map(parseJSONFields);
    }

    return res.json({ status: true, ...result });
  } catch (err) {
    console.error("createBooking error", err);
    res
      .status(500)
      .json({ status: false, error: err.message || "Internal error" });
  }
};

exports.getBookingSections = async (req, res) => {
  try {
    const today = await getTodayBookings();
    const bookings = await getAllBookings();
    const recent = await getRecentBookings();
    const completed = await getCompletedBookings();
    const pre = await getPreBookings();
    const web = await getWebBookings();
    const quoted = await getQuotedBookings();
    const ivr = await getIvrBookings();
    const app = await getAppBookings();

    return res.json({
      success: true,
      message: "Booking Loaded Successfully",
      today_bookings: today.length,
        bookings: bookings.length,
        pre_bookings: pre.length,
        recent_bookings: recent.length,
        completed_bookings: completed.length,
        web_bookings: web.length,
        quoted_bookings: quoted.length,
        ivr_bookings: ivr.length,
        app_bookings: app.length,
      data: {
        today_bookings: today,
        bookings: bookings,
        pre_bookings: pre,
        recent_bookings: recent,
        completed_bookings: completed,
        web_bookings: web,
        quoted_bookings: quoted,
        ivr_bookings: ivr,
        app_bookings: app,
      },
    });
  } catch (error) {
    console.error("Error loading booking sections:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
