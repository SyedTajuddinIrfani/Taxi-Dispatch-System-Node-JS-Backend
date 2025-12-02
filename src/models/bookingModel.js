const pool = require('../db');

const insertBookingRow = async (client, bookingRow) => {
  const cols = Object.keys(bookingRow);
  const vals = Object.values(bookingRow);
  const params = vals.map((_, i) => `$${i + 1}`).join(',');
  const sql = `INSERT INTO bookings (${cols.join(',')})
               VALUES (${params})
               RETURNING *;`;
  const res = await client.query(sql, vals);
  return res.rows[0];
};

const updateBooking = async (id, updates) => {
  const cols = Object.keys(updates);
  const vals = Object.values(updates);
  if (!cols.length) return null;
  const set = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const sql = `UPDATE bookings SET ${set}, updated_at = now() WHERE id = $1 RETURNING *`;
  const res = await pool.query(sql, [id, ...vals]);
  return res.rows[0];
};

const findBookingById = async (id) => {
  const res = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
  return res.rows[0];
};

module.exports = {
  pool,
  insertBookingRow,
  updateBooking,
  findBookingById
};
