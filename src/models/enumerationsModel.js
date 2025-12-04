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
  

    return {
      booking_statuses: booking_statuses.rows,
      booking_types: booking_types.rows,
      journey_types: journey_types.rows,
      payment_statuses: payment_statuses.rows,
      payment_types: payment_types.rows,
      vehicle_types: vehicle_types.rows,
      subsidiaries: subsidiaries.rows,
      drivers: drivers.rows,
    };
  },
};

module.exports = EnumerationsModel;
