// services/bookingService.js
const crypto = require('crypto');
const { pool, insertBookingRow, updateBooking, findBookingById } = require('../models/bookingModel');

const DEFAULT_EMPLOYEE_ID = 23; // matches your example responses; change if needed

function genRef() {
  return crypto.randomBytes(4).toString('hex'); // 8 hex chars like dcb75152
}

function strOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

function normalizeBookingPayload(src) {
  // Normalize keys and ensure JSON string fields are stored as text (stringified)
  const b = { ...src };

  // Fields that in DB are stringified JSON
  const jsonFields = ['viapoints','restricted_drivers','child_seat','notes','skipped_bookings'];
  for (const f of jsonFields) {
    if (b[f] !== undefined && b[f] !== null) {
      if (typeof b[f] === 'string') {
        // keep as-is (your API often sends stringified JSON)
        b[f] = b[f];
      } else {
        b[f] = JSON.stringify(b[f]);
      }
    } else {
      b[f] = '[]';
    }
  }

  // Booleans default
  b.quotation = b.quotation || false;
  b.quoted = b.quoted || false;
  b.commission = b.commission === undefined ? true : !!b.commission;

  // default employee
  b.employee_id = b.employee_id || DEFAULT_EMPLOYEE_ID;

  // reference
  b.reference_number = b.reference_number || genRef();

  // total_charges fallback to fares
  if (b.total_charges === undefined || b.total_charges === null) {
    b.total_charges = b.fares ?? 0;
  }

  // ensure emailflag naming (DB column is lower-case 'emailflag')
  if (b.emailFlag !== undefined) {
    b.emailflag = b.emailFlag;
    delete b.emailFlag;
  }

  return b;
}

/**
 * Insert single booking row within a transaction using a client.
 * bookingObj = normalized payload object (strings where DB expects text)
 */
async function createBookingRow(client, bookingObj) {
  // map allowed columns from your table (only include keys that exist in table)
  const allowed = [
    'reference_number','subsidiary_id','booking_type_id','booking_status_id','journey_type_id',
    'account_id','customer_id','employee_id','pickup','dropoff','pickup_date','pickup_time',
    'dropoff_date','dropoff_time','pickup_door_number','dropoff_door_number','pickup_plot','dropoff_plot',
    'pickup_location_type_id','dropoff_location_type_id','pickup_latitude','pickup_longitude',
    'dropoff_latitude','dropoff_longitude','viapoints','restricted_drivers','flight_number','arriving_from',
    'vehicle_type_id','vehicle_id','driver_id','passengers','luggages','hand_luggages','child_seat',
    'name','email','mobile','telephone','lead_time','notes','special_instructions','payment_type_id',
    'company_price','fares','total_charges','parking_charges','waiting_charges','extra_drop_charges',
    'credit_card_charges','congestion_charges','miles','meet_and_greet','department','escort_id','order_number',
    'booked_by','add_return_fare','fare_meter_status','fare_meter','quotation','quoted','dispatch','dispatch_as',
    'sms','emailflag','trash','hidden','multi_booking_id','associated_booking','invoice_status','commission_status',
    'commission','skipped_bookings','permanent','toggle_driver_text','toggle_passenger_text','cancelled_reason',
    'booking_source','on_route','arrived','passenger_on_board','completed','controller_completed','driver_waiting_time',
    'dispatched_at','booked_at','stripe_customer_id','stripe_payment_id','invoice_number','initial_subsidiary_id'
  ];

  const row = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(bookingObj, k) && bookingObj[k] !== undefined) {
      row[k] = bookingObj[k];
    }
  }

  // set defaults for some columns if not present
  if (!row.booked_at) row.booked_at = new Date();
  if (row.multi_booking_id === undefined) row.multi_booking_id = 0;

  const inserted = await insertBookingRow(client, row);
  return inserted;
}

/**
 * Create simple booking (single booking)
 */
async function createSimpleBooking(payload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // customer creation/upsert (minimal)
    let customerId = payload.customer_id || null;
    if (!customerId && payload.customer) {
      const c = payload.customer;
      const res = await client.query(
        `INSERT INTO customers (name,email,mobile,telephone,blacklist)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO UPDATE SET mobile = EXCLUDED.mobile
         RETURNING id`,
         [c.name || payload.name, c.email || payload.email, c.mobile || payload.mobile, c.telephone || payload.telephone, c.blacklist || null]
      );
      customerId = res.rows[0].id;
    } else if (!customerId && payload.email) {
      // try insert by email minimal
      const res = await client.query(
        `INSERT INTO customers (name,email,mobile,telephone)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET mobile = EXCLUDED.mobile
         RETURNING id`,
         [payload.name, payload.email, payload.mobile, payload.telephone]
      );
      customerId = res.rows[0].id;
    }

    const normalized = normalizeBookingPayload(payload);
    if (customerId) normalized.customer_id = customerId;

    const inserted = await createBookingRow(client, normalized);
    await client.query('COMMIT');

    return { booking: [inserted] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Create two-way booking (primary + return)
 * payload = single booking object which includes journey_type_id == 2
 * returns { booking: [primary], return_booking: [returnRow] }
 */
async function createTwoWayBooking(payload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // create customer similar to simple flow
    let customerId = payload.customer_id || null;
    if (!customerId && payload.customer) {
      const c = payload.customer;
      const res = await client.query(
        `INSERT INTO customers (name,email,mobile,telephone)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET mobile = EXCLUDED.mobile
         RETURNING id`,
         [c.name || payload.name, c.email || payload.email, c.mobile || payload.mobile, c.telephone || payload.telephone]
      );
      customerId = res.rows[0].id;
    }

    const normalized = normalizeBookingPayload(payload);
    if (customerId) normalized.customer_id = customerId;

    // create primary booking
    const primary = await createBookingRow(client, normalized);

    // build return booking: mostly copying primary, swap pickup/dropoff, set associated_booking
    const returnBooking = { ...normalized };

    // swap pickup/dropoff & related fields (plots/doors/location types/latlng)
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

    // set association
    returnBooking.associated_booking = primary.id;
    returnBooking.reference_number = genRef();
    // return trip often uses same journey_type_id (2)
    // reset driver/vehicle maybe - keep as-is or null according to payload
    returnBooking.driver_id = returnBooking.driver_id || null;

    const retInserted = await createBookingRow(client, returnBooking);

    await client.query('COMMIT');

    return { booking: [primary], return_booking: [retInserted] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Multi-vehicle booking: payload.booking is an array of booking objects (same customer)
 * All bookings share same multi_booking_id
 */
async function createMultiVehicleBooking(payload) {
  // payload.booking = array of entries
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // create/get customer
    let customerId = payload.customer_id || null;
    if (!customerId && payload.customer) {
      const c = payload.customer;
      const res = await client.query(
        `INSERT INTO customers (name,email,mobile,telephone)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET mobile = EXCLUDED.mobile
         RETURNING id`,
         [c.name, c.email, c.mobile, c.telephone]
      );
      customerId = res.rows[0].id;
    }

    // create a new multi_booking_id (use sequence nextval or timestamp-based id)
    const multiBookingIdRes = await client.query('SELECT nextval(\'bookings_id_seq\') as nextid');
    const multiBookingId = parseInt(multiBookingIdRes.rows[0].nextid, 10);

    const created = [];
    for (const b of payload.booking) {
      const merged = { ...payload, ...b }; // allow top-level defaults
      // override some top-level keys that shouldn't carry over in merged
      delete merged.booking;
      delete merged.booking_type_id; // booking_type_id may be provided at top-level; keep if present in merged
      const normalized = normalizeBookingPayload(merged);
      if (customerId) normalized.customer_id = customerId;
      normalized.multi_booking_id = multiBookingId;
      normalized.reference_number = genRef();
      const inserted = await createBookingRow(client, normalized);
      created.push(inserted);
    }

    await client.query('COMMIT');
    return { booking: created };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Multi-bookings: payload.booking is array of similar bookings across multiple dates (booking_type_id==2)
 * Similar to multi-vehicle but shares multi_booking_id
 */
async function createMultiBookings(payload) {
  // re-use multi-vehicle logic; it's the same: create multiple bookings, same multi_booking_id
  return createMultiVehicleBooking(payload);
}

/**
 * Main entrypoint - detects flow and delegates
 */
async function create(payload) {
  // If payload.booking exists and is array -> multi-vehicle or multi-bookings
  if (Array.isArray(payload.booking) && payload.booking.length > 0) {
    // Determine if multi-bookings (booking_type_id == 2) or multi-vehicle
    if (payload.booking_type_id === 2 || payload.booking_type_id == '2') {
      return createMultiBookings(payload);
    } else {
      return createMultiVehicleBooking(payload);
    }
  }

  // If single payload and journey_type_id == 2 -> two-way (return)
  if (payload.journey_type_id === 2 || payload.journey_type_id == '2') {
    return createTwoWayBooking(payload);
  }

  // Default simple booking
  return createSimpleBooking(payload);
}

module.exports = {
  create,
  genRef,
  normalizeBookingPayload
};
