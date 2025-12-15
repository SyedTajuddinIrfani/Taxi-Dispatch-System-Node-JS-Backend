const db = require("../db");

const createBatch = async (token) => {
  const result = await db.query(
    `INSERT INTO call_event_batches (token)
     VALUES ($1)
     RETURNING id`,
    [token]
  );
  return result.rows[0].id;
};

const insertEvents = async (batchId, events) => {
  const query = `
    INSERT INTO call_events
    (batch_id, call_id, dialled_number, extension, caller_id, status, event_time)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
  `;

  for (const e of events) {
    await db.query(query, [
      batchId,
      e.callId || "",
      e.dialledNumber || "",
      e.extension,
      e.callerId || "",
      e.status,
      e.time,
    ]);
  }
};

const getEventsByToken = async (token) => {
  const result = await db.query(
    `
    SELECT b.token, e.*
    FROM call_event_batches b
    JOIN call_events e ON e.batch_id = b.id
    WHERE b.token = $1
    ORDER BY e.id DESC
    `,
    [token]
  );
  return result.rows;
};

const deleteEventsByToken = async (token) => {
  const result = await db.query(
    `DELETE FROM call_event_batches WHERE token = $1`,
    [token]
  );
  return result.rowCount;
};

module.exports = {
  createBatch,
  insertEvents,
  getEventsByToken,
  deleteEventsByToken,
};
