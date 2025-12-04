const db = require("../db");

const EnumerationsModel = {
  getAll: async (subsidiary_id) => {
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
     const query = `
        SELECT
          a.id, a.account_type, a.closed, a.name, a.email, a.payment_types, a.information, a.background_color, a.foreground_color,
          json_agg(DISTINCT jsonb_build_object('id', d.id, 'name', d.name)) AS departments,
          jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'telephone_number', s.telephone_number,
            'email', s.email
          ) AS subsidiary
        FROM accounts a
        LEFT JOIN departments d ON a.id = d.account_id
        LEFT JOIN subsidiaries s ON a.subsidiary_id = s.id
        WHERE a.subsidiary_id = $1
        GROUP BY a.id, s.id
        ORDER BY a.id ASC;
      `;
    
      const account = await db.query(query, [subsidiary_id]);

    return {
      booking_statuses: booking_statuses.rows,
      booking_types: booking_types.rows,
      journey_types: journey_types.rows,
      payment_statuses: payment_statuses.rows,
      payment_types: payment_types.rows,
      vehicle_types: vehicle_types.rows,
      subsidiaries: subsidiaries.rows,
      drivers: drivers.rows,
      accounts: account.rows
    };
  },
};

module.exports = EnumerationsModel;
