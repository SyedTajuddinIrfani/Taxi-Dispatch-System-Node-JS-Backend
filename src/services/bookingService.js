const {
  pool,
  insertBookingRow,
  updateBooking,
  findBookingById,
} = require("../models/bookingModel");

const DEFAULT_EMPLOYEE_ID = 2;

// --------------------------------------------------
// UNIQUE REFERENCE GENERATOR
// --------------------------------------------------
async function genRef() {
  let ref;
  let exists = true;

  while (exists) {
    const digits = Math.floor(10000 + Math.random() * 90000).toString();
    ref = "NTG" + digits;

    const checkQuery = `SELECT reference_number FROM bookings WHERE reference_number = $1 LIMIT 1`;
    const result = await pool.query(checkQuery, [ref]);

    if (result.rows.length === 0) exists = false;
  }
  return ref;
}

function strOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

// --------------------------------------------------
// NORMALIZER
// --------------------------------------------------
async function normalizeBookingPayload(src) {
  const b = { ...src };

  const jsonFields = [
    "viapoints",
    "restricted_drivers",
    "child_seat",
    "notes",
    "skipped_bookings",
  ];

  for (const f of jsonFields) {
    if (b[f] !== undefined && b[f] !== null) {
      b[f] = typeof b[f] === "string" ? b[f] : JSON.stringify(b[f]);
    } else {
      b[f] = "[]";
    }
  }

  b.quotation = b.quotation || false;
  b.quoted = b.quoted || false;
  b.commission = b.commission === undefined ? true : !!b.commission;

  b.employee_id = b.employee_id || DEFAULT_EMPLOYEE_ID;

  b.reference_number = b.reference_number || (await genRef());

  if (b.total_charges === undefined || b.total_charges === null) {
    b.total_charges = b.fares ?? 0;
  }

  if (b.emailFlag !== undefined) {
    b.emailflag = b.emailFlag;
    delete b.emailFlag;
  }

  return b;
}

// --------------------------------------------------
// INSERT BOOKING ROW
// --------------------------------------------------
async function createBookingRow(pool, bookingObj) {
  // List of allowed DB columns
  const allowed = [
    "reference_number",
    "subsidiary_id",
    "booking_type_id",
    "booking_status_id",
    "journey_type_id",
    "account_id",
    "customer_id",
    "employee_id",
    "pickup",
    "dropoff",
    "pickup_date",
    "pickup_time",
    "dropoff_date",
    "dropoff_time",
    "pickup_door_number",
    "dropoff_door_number",
    "pickup_plot",
    "dropoff_plot",
    "pickup_location_type_id",
    "dropoff_location_type_id",
    "pickup_latitude",
    "pickup_longitude",
    "dropoff_latitude",
    "dropoff_longitude",
    "viapoints",
    "restricted_drivers",
    "flight_number",
    "arriving_from",
    "vehicle_type_id",
    "vehicle_id",
    "driver_id",
    "passengers",
    "luggages",
    "hand_luggages",
    "child_seat",
    "name",
    "email",
    "mobile",
    "telephone",
    "lead_time",
    "notes",
    "special_instructions",
    "payment_type_id",
    "company_price",
    "fares",
    "total_charges",
    "parking_charges",
    "waiting_charges",
    "extra_drop_charges",
    "credit_card_charges",
    "congestion_charges",
    "miles",
    "meet_and_greet",
    "department",
    "escort_id",
    "order_number",
    "booked_by",
    "add_return_fare",
    "fare_meter_status",
    "fare_meter",
    "quotation",
    "quoted",
    "dispatch",
    "dispatch_as",
    "sms",
    "emailflag",
    "trash",
    "hidden",
    "multi_booking_id",
    "associated_booking",
    "invoice_status",
    "commission_status",
    "commission",
    "skipped_bookings",
    "permanent",
    "toggle_driver_text",
    "toggle_passenger_text",
    "cancelled_reason",
    "booking_source",
    "on_route",
    "arrived",
    "passenger_on_board",
    "completed",
    "controller_completed",
    "driver_waiting_time",
    "dispatched_at",
    "booked_at",
    "stripe_customer_id",
    "stripe_payment_id",
    "invoice_number",
    "initial_subsidiary_id",
    "eta",
  ];

  // 🔥 FIX: Properly DEFINE row before using it
  const row = {};
  for (const k of allowed) {
    if (
      Object.prototype.hasOwnProperty.call(bookingObj, k) &&
      bookingObj[k] !== undefined
    ) {
      row[k] = bookingObj[k];
    }
  }

  // defaults
  if (!row.booked_at) row.booked_at = new Date();
  if (row.multi_booking_id === undefined) row.multi_booking_id = 0;

  // INSERT
  const inserted = await insertBookingRow(pool, row);
  return inserted;
}

// --------------------------------------------------
// CREATE SIMPLE BOOKING
// --------------------------------------------------
async function createSimpleBooking(payload) {
  try {
    await pool.query("BEGIN");

    let customerId = payload.customer_id || null;

    if (!customerId && payload.customer) {
      const c = payload.customer;
      const res = await pool.query(
        `INSERT INTO customers (name,email,mobile,telephone,blacklist)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO UPDATE SET mobile=EXCLUDED.mobile
         RETURNING id`,
        [
          c.name || payload.name,
          c.email || payload.email,
          c.mobile || payload.mobile,
          c.telephone || payload.telephone,
          c.blacklist || null,
        ]
      );
      customerId = res.rows[0].id;
    } else if (!customerId && payload.email) {
      const res = await pool.query(
        `INSERT INTO customers (name,email,mobile,telephone)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET mobile=EXCLUDED.mobile
         RETURNING id`,
        [payload.name, payload.email, payload.mobile, payload.telephone]
      );
      customerId = res.rows[0].id;
    }

    const normalized = await normalizeBookingPayload(payload);
    if (customerId) normalized.customer_id = customerId;

    const inserted = await createBookingRow(pool, normalized);
    await pool.query("COMMIT");

    return { booking: [inserted] };
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

// --------------------------------------------------
// CREATE TWO-WAY BOOKING
// --------------------------------------------------
async function createTwoWayBooking(payload) {
  try {
    await pool.query("BEGIN");

    let customerId = payload.customer_id || null;
    if (!customerId && payload.customer) {
      const c = payload.customer;
      const res = await pool.query(
        `INSERT INTO customers (name,email,mobile,telephone)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET mobile=EXCLUDED.mobile
         RETURNING id`,
        [
          c.name || payload.name,
          c.email || payload.email,
          c.mobile || payload.mobile,
          c.telephone || payload.telephone,
        ]
      );
      customerId = res.rows[0].id;
    }

    const normalized = await normalizeBookingPayload(payload);
    if (customerId) normalized.customer_id = customerId;

    const primary = await createBookingRow(pool, normalized);

    const returnBooking = { ...normalized };

    returnBooking.pickup = normalized.dropoff;
    returnBooking.dropoff = normalized.pickup;

    returnBooking.pickup_door_number = normalized.dropoff_door_number;
    returnBooking.dropoff_door_number = normalized.pickup_door_number;

    returnBooking.pickup_plot = normalized.dropoff_plot;
    returnBooking.dropoff_plot = normalized.pickup_plot;

    returnBooking.pickup_location_type_id = normalized.dropoff_location_type_id;
    returnBooking.dropoff_location_type_id = normalized.pickup_location_type_id;

    returnBooking.pickup_latitude = normalized.dropoff_latitude;
    returnBooking.pickup_longitude = normalized.dropoff_longitude;
    returnBooking.dropoff_latitude = normalized.pickup_latitude;
    returnBooking.dropoff_longitude = normalized.pickup_longitude;

    returnBooking.associated_booking = primary.id;
    returnBooking.reference_number = await genRef();
    returnBooking.driver_id = returnBooking.driver_id || null;

    const retInserted = await createBookingRow(pool, returnBooking);

    await pool.query("COMMIT");

    return { booking: [primary, retInserted] };
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

// --------------------------------------------------
// MULTI VEHICLE booking
// --------------------------------------------------
async function createMultiVehicleBooking(payload) {
  try {
    await pool.query("BEGIN");

    let customerId = payload.customer_id || null;

    if (!customerId && payload.customer) {
      const c = payload.customer;
      const res = await pool.query(
        `INSERT INTO customers (name,email,mobile,telephone)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET mobile=EXCLUDED.mobile
         RETURNING id`,
        [c.name, c.email, c.mobile, c.telephone]
      );
      customerId = res.rows[0].id;
    }

    const multiBookingIdRes = await pool.query(
      "SELECT nextval('bookings_id_seq') as nextid"
    );
    const multiBookingId = parseInt(multiBookingIdRes.rows[0].nextid, 10);

    const created = [];

    for (const b of payload.booking) {
      const merged = { ...payload, ...b };
      delete merged.booking;

      const normalized = await normalizeBookingPayload(merged);
      if (customerId) normalized.customer_id = customerId;

      normalized.multi_booking_id = multiBookingId;
      normalized.reference_number = await genRef();

      const inserted = await createBookingRow(pool, normalized);
      created.push(inserted);
    }

    await pool.query("COMMIT");
    return { booking: created };
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

async function createMultiBookings(payload) {
  return createMultiVehicleBooking(payload);
}

// --------------------------------------------------
// ⭐⭐ NEW: MULTI RESERVATION BOOKING ⭐⭐
// --------------------------------------------------
async function createMultiReservationBooking(payload) {
  try {
    await pool.query("BEGIN");

    const customerPayload = payload.customer?.[0] || payload.customer;
    let customerId = payload.customer_id || null;

    if (!customerId && customerPayload) {
      const res = await pool.query(
        `INSERT INTO customers (name,email,mobile,telephone,blacklist)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO UPDATE SET mobile=EXCLUDED.mobile
         RETURNING id`,
        [
          customerPayload.name || payload.name,
          customerPayload.email || payload.email,
          customerPayload.mobile || payload.mobile,
          customerPayload.telephone || payload.telephone,
          customerPayload.blacklist || false,
        ]
      );
      customerId = res.rows[0].id;
    }

    const multiBookingIdRes = await pool.query(
      "SELECT nextval('bookings_id_seq') as nextid"
    );
    const multiBookingId = parseInt(multiBookingIdRes.rows[0].nextid, 10);

    const created = [];

    for (const mr of payload.multi_reservation) {
      if (mr.exclude === true) continue;

      const clone = { ...payload };

      clone.pickup_date = mr.pickup_date;
      clone.pickup_time = mr.pickup_time;

      const normalized = await normalizeBookingPayload(clone);

      normalized.customer_id = customerId;
      normalized.multi_booking_id = multiBookingId;
      normalized.reference_number = await genRef();

      const inserted = await createBookingRow(pool, normalized);
      created.push(inserted);
    }

    await pool.query("COMMIT");
    return { booking: created };
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

// --------------------------------------------------
// MAIN CONTROLLER
// --------------------------------------------------
async function create(payload) {
  // 🔥 FORCE PARSE multi_reservation IF STRING
  if (typeof payload.multi_reservation === "string") {
    try {
      payload.multi_reservation = JSON.parse(payload.multi_reservation);
    } catch (e) {
      payload.multi_reservation = [];
    }
  }

  // ⭐ MULTI RESERVATION DETECTION
  if (
    Array.isArray(payload.multi_reservation) &&
    payload.multi_reservation.length > 0
  ) {
    // EXCLUDE FILTER
    payload.multi_reservation = payload.multi_reservation.filter(
      (b) => !b.exclude
    );

    if (payload.multi_reservation.length === 0) {
      throw new Error(
        "All multi reservations are excluded — nothing to insert."
      );
    }
    return createMultiReservationBooking(payload);
  }

  // MULTI-VEHICLE / MULTI BOOKINGS
  if (Array.isArray(payload.booking) && payload.booking.length > 0) {
    if (payload.booking_type_id === 2 || payload.booking_type_id == "2") {
      return createMultiBookings(payload);
    } else {
      return createMultiVehicleBooking(payload);
    }
  }

  // TWO-WAY
  if (payload.journey_type_id === 2 || payload.journey_type_id == "2") {
    return createTwoWayBooking(payload);
  }

  // SIMPLE
  return createSimpleBooking(payload);
}

// EXPORTS
module.exports = {
  create,
  genRef,
  normalizeBookingPayload,
};
