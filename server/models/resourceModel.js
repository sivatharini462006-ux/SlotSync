const { pool } = require('../config/db');

/**
 * Fetch all resources with optional filters (type, building, floor_number, status, search)
 * Also optionally checks live conflict status if date + startTime + endTime are provided
 */
const getAllResources = async ({
  type,
  building,
  floorNumber,
  status,
  search,
  date,
  startTime,
  endTime,
}) => {
  const params = [];
  let availabilitySelect = `'AVAILABLE' AS live_status`;

  if (date && startTime && endTime) {
    availabilitySelect = `
      CASE
        WHEN r.status != 'ACTIVE' THEN 'UNAVAILABLE'
        WHEN EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.resource_id = r.id
            AND b.booking_date = ?
            AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
            AND b.start_time < ?
            AND b.end_time > ?
        ) THEN 'BOOKED'
        ELSE 'AVAILABLE'
      END AS live_status
    `;
    params.push(date, endTime, startTime);
  } else {
    availabilitySelect = `
      CASE
        WHEN r.status != 'ACTIVE' THEN 'UNAVAILABLE'
        ELSE 'AVAILABLE'
      END AS live_status
    `;
  }

  let query = `
    SELECT
      r.id,
      r.resource_code,
      r.resource_name,
      r.resource_type,
      rc.description AS category_description,
      r.description,
      r.building,
      r.floor_number,
      f.floor_name,
      r.room_number,
      r.capacity,
      r.status,
      ${availabilitySelect},
      r.created_at,
      r.updated_at
    FROM resources r
    LEFT JOIN resource_categories rc ON r.resource_type = rc.category_name
    LEFT JOIN floors f ON r.building = f.building_name AND r.floor_number = f.floor_number
    WHERE 1 = 1
  `;

  if (type) {
    query += ` AND r.resource_type = ?`;
    params.push(type.toUpperCase());
  }

  if (building) {
    query += ` AND r.building = ?`;
    params.push(building);
  }

  if (floorNumber !== undefined && floorNumber !== '') {
    query += ` AND r.floor_number = ?`;
    params.push(Number(floorNumber));
  }

  if (status) {
    query += ` AND r.status = ?`;
    params.push(status.toUpperCase());
  }

  if (search) {
    query += ` AND (r.resource_name LIKE ? OR r.resource_code LIKE ? OR r.room_number LIKE ? OR r.description LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY r.building ASC, r.floor_number ASC, r.resource_code ASC`;

  const [rows] = await pool.execute(query, params);
  return rows;
};

/**
 * Fetch a single resource by ID
 */
const getResourceById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       r.*,
       rc.description AS category_description,
       f.floor_name
     FROM resources r
     LEFT JOIN resource_categories rc ON r.resource_type = rc.category_name
     LEFT JOIN floors f ON r.building = f.building_name AND r.floor_number = f.floor_number
     WHERE r.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Fetch a single resource by unique resource_code
 */
const getResourceByCode = async (resourceCode) => {
  const [rows] = await pool.execute(
    `SELECT * FROM resources WHERE resource_code = ? LIMIT 1`,
    [resourceCode.toUpperCase().trim()]
  );
  return rows[0] || null;
};

/**
 * Ensure building + floor exists in floors table
 */
const ensureFloorExists = async (building, floorNumber) => {
  await pool.execute(
    `INSERT IGNORE INTO floors (building_name, floor_number, floor_name)
     VALUES (?, ?, ?)`,
    [building.trim(), Number(floorNumber), `Floor ${floorNumber}`]
  );
};

/**
 * Create a new resource
 */
const createResource = async ({
  resourceCode,
  resourceName,
  resourceType,
  description,
  building,
  floorNumber,
  roomNumber,
  capacity,
  status,
}) => {
  await ensureFloorExists(building, floorNumber);

  const [result] = await pool.execute(
    `INSERT INTO resources (
      resource_code, resource_name, resource_type, description,
      building, floor_number, room_number, capacity, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resourceCode.toUpperCase().trim(),
      resourceName.trim(),
      resourceType.toUpperCase(),
      description ? description.trim() : null,
      building.trim(),
      Number(floorNumber),
      roomNumber.trim(),
      Number(capacity) || 1,
      status ? status.toUpperCase() : 'ACTIVE',
    ]
  );

  return result.insertId;
};

/**
 * Update an existing resource
 */
const updateResource = async (
  id,
  {
    resourceCode,
    resourceName,
    resourceType,
    description,
    building,
    floorNumber,
    roomNumber,
    capacity,
    status,
  }
) => {
  await ensureFloorExists(building, floorNumber);

  const [result] = await pool.execute(
    `UPDATE resources
     SET resource_code = ?,
         resource_name = ?,
         resource_type = ?,
         description = ?,
         building = ?,
         floor_number = ?,
         room_number = ?,
         capacity = ?,
         status = ?
     WHERE id = ?`,
    [
      resourceCode.toUpperCase().trim(),
      resourceName.trim(),
      resourceType.toUpperCase(),
      description ? description.trim() : null,
      building.trim(),
      Number(floorNumber),
      roomNumber.trim(),
      Number(capacity) || 1,
      status.toUpperCase(),
      id,
    ]
  );

  return result.affectedRows > 0;
};

/**
 * Deactivate or delete a resource
 */
const removeOrDeactivateResource = async (id) => {
  const [bookings] = await pool.execute(
    `SELECT COUNT(*) AS count FROM bookings WHERE resource_id = ?`,
    [id]
  );

  if (bookings[0].count > 0) {
    await pool.execute(`UPDATE resources SET status = 'INACTIVE' WHERE id = ?`, [id]);
    return { action: 'DEACTIVATED' };
  }

  await pool.execute(`DELETE FROM resources WHERE id = ?`, [id]);
  return { action: 'DELETED' };
};

/**
 * Fetch active reservations for a resource on a given date
 */
const getResourceBookingsByDate = async (resourceId, bookingDate) => {
  const [rows] = await pool.execute(
    `SELECT
       id,
       booking_code,
       booking_date,
       start_time,
       end_time,
       status
     FROM bookings
     WHERE resource_id = ?
       AND booking_date = ?
       AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
     ORDER BY start_time ASC`,
    [resourceId, bookingDate]
  );
  return rows;
};

/**
 * Fetch all floors for the Interactive Floor Map selector
 */
const getAllFloors = async () => {
  const [rows] = await pool.execute(
    `SELECT id, building_name, floor_number, floor_name
     FROM floors
     ORDER BY building_name ASC, floor_number ASC`
  );
  return rows;
};

module.exports = {
  getAllResources,
  getResourceById,
  getResourceByCode,
  createResource,
  updateResource,
  removeOrDeactivateResource,
  getResourceBookingsByDate,
  getAllFloors,
};