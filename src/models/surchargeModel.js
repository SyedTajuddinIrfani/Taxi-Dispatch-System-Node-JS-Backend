const pool = require("../db");

module.exports = {
  async create(data) {
    const query = `
      INSERT INTO surcharges (
        surcharges_type, condition, postcode, operator, fare, parking_charges,
        extra_drop_charges, congestion_charges, duration, from_date, from_time,
        to_date, to_time, active, day
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id,
                TO_CHAR(from_date, 'DD-MM-YYYY') AS from_date,
                TO_CHAR(to_date, 'DD-MM-YYYY') AS to_date,
                surcharges_type, condition, postcode, operator, fare, parking_charges,
                extra_drop_charges, congestion_charges, duration,from_time, to_time, active, day;
    `;

    const values = [
      data.surcharges_type,
      data.condition,
      data.postcode,
      data.operator,
      data.fare,
      data.parking_charges,
      data.extra_drop_charges,
      data.congestion_charges,
      data.duration,
      data.from_date,
      data.from_time,
      data.to_date,
      data.to_time,
      data.active,
      data.day,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async update(id, data) {
    const query = `
      UPDATE surcharges SET
        surcharges_type=$1, condition=$2, postcode=$3, operator=$4, fare=$5,
        parking_charges=$6, extra_drop_charges=$7, congestion_charges=$8,
        duration=$9, from_date=$10, from_time=$11, to_date=$12, to_time=$13,
        active=$14, day=$15
      WHERE id=$16
      RETURNING *;
    `;

    const values = [
      data.surcharges_type,
      data.condition,
      data.postcode,
      data.operator,
      data.fare,
      data.parking_charges,
      data.extra_drop_charges,
      data.congestion_charges,
      data.duration,
      data.from_date,
      data.from_time,
      data.to_date,
      data.to_time,
      data.active,
      data.day,
      id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      "DELETE FROM surcharges WHERE id=$1 RETURNING id;",
      [id]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query(
      `SELECT id,
                TO_CHAR(from_date, 'DD-MM-YYYY') AS from_date,
                TO_CHAR(to_date, 'DD-MM-YYYY') AS to_date,
                surcharges_type, condition, postcode, operator, fare, parking_charges,
                extra_drop_charges, congestion_charges, duration,from_time, to_time, active, day, created_at, updated_at FROM surcharges ORDER BY id ASC;`
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query("SELECT * FROM surcharges WHERE id=$1;", [
      id,
    ]);
    return result.rows[0];
  },
};

