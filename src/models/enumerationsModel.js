const db = require("../db");

const EnumerationsModel = {
  getAll: async () => {
    const booking_statuses = await db.query(
      `SELECT * FROM booking_statuses ORDER BY id ASC`
    );
    const booking_types = await db.query(
      `SELECT * FROM booking_types ORDER BY id ASC`
    );
    const journey_types = await db.query(
      `SELECT * FROM journey_types ORDER BY id ASC`
    );
    const payment_statuses = await db.query(
      `SELECT * FROM payment_statuses ORDER BY id ASC`
    );
    const payment_types = await db.query(
      `SELECT * FROM payment_types ORDER BY id ASC`
    );
    const vehicle_types = await db.query(
      `SELECT * FROM vehicle_types ORDER BY id ASC`
    );
    const subsidiaries = await db.query(
      `SELECT id, background_color, foreground_color, name FROM subsidiaries ORDER BY id ASC`
    );
    const sql = `SELECT id, username, name, email FROM drivers WHERE session_status = $1 AND active = $2 ORDER BY id ASC`;
    const drivers = await db.query(sql, ["logged_in", true]);

    // 🔥 BOOKING TABS WITH COUNTS
    const booking_tabs = await db.query(`
      SELECT
        bt.id,
        bt.booking_tabs,
        CASE bt.id
          WHEN 1 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE DATE(pickup_date) = CURRENT_DATE 
            AND booking_status_id = 1
          )
          WHEN 2 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE DATE(pickup_date) > CURRENT_DATE
          )
          WHEN 3 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE booking_status_id != 11 AND booking_status_id != 1
          )
          WHEN 4 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE booking_status_id = 11
          )
          WHEN 5 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE quoted = true
          )
          WHEN 6 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE booking_source = 'ivr'
          )
          WHEN 7 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE booking_source = 'web'
          )
          WHEN 8 THEN (
            SELECT COUNT(*) FROM bookings 
            WHERE booking_source = 'app'
          )
        END::int AS booking_count
      FROM booking_tabs bt
      ORDER BY bt.id ASC
    `);

    return {
      booking_statuses: booking_statuses.rows,
      booking_types: booking_types.rows,
      journey_types: journey_types.rows,
      payment_statuses: payment_statuses.rows,
      payment_types: payment_types.rows,
      vehicle_types: vehicle_types.rows,
      subsidiaries: subsidiaries.rows,
      drivers: drivers.rows,
      booking_tabs: booking_tabs.rows,
    };
  },
};

module.exports = EnumerationsModel;
