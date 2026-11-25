const { ApiError } = require('../middleware/errorHandler');
const {
  getAllResources,
  getResourceById,
  getResourceByCode,
  createResource,
  updateResource,
  removeOrDeactivateResource,
  getResourceBookingsByDate,
  getAllFloors,
} = require('../models/resourceModel');
const { logAudit } = require('../utils/auditLogger');

const VALID_TYPES = [
  'LIBRARY_SEAT',
  'LAB_COMPUTER',
  'STUDY_ROOM',
  'PROJECTOR',
  'OTHER_EQUIPMENT',
];

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

// Standard campus operating hours (08:00 to 20:00 in 1-hour blocks) for visual slot display
const STANDARD_SLOTS = [
  { start: '08:00:00', end: '09:00:00', label: '08:00 AM - 09:00 AM' },
  { start: '09:00:00', end: '10:00:00', label: '09:00 AM - 10:00 AM' },
  { start: '10:00:00', end: '11:00:00', label: '10:00 AM - 11:00 AM' },
  { start: '11:00:00', end: '12:00:00', label: '11:00 AM - 12:00 PM' },
  { start: '12:00:00', end: '13:00:00', label: '12:00 PM - 01:00 PM' },
  { start: '13:00:00', end: '14:00:00', label: '01:00 PM - 02:00 PM' },
  { start: '14:00:00', end: '15:00:00', label: '02:00 PM - 03:00 PM' },
  { start: '15:00:00', end: '16:00:00', label: '03:00 PM - 04:00 PM' },
  { start: '16:00:00', end: '17:00:00', label: '04:00 PM - 05:00 PM' },
  { start: '17:00:00', end: '18:00:00', label: '05:00 PM - 06:00 PM' },
  { start: '18:00:00', end: '19:00:00', label: '06:00 PM - 07:00 PM' },
  { start: '19:00:00', end: '20:00:00', label: '07:00 PM - 08:00 PM' },
];

/**
 * @desc    Get all resources with optional filters and live availability
 * @route   GET /api/resources
 * @access  Private (Authenticated users)
 */
const listResources = async (req, res, next) => {
  try {
    const { type, building, floor_number, status, search, date, start_time, end_time } = req.query;

    const resources = await getAllResources({
      type,
      building,
      floorNumber: floor_number,
      status,
      search,
      date,
      startTime: start_time,
      endTime: end_time,
    });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all building floors
 * @route   GET /api/resources/floors
 * @access  Private
 */
const listFloors = async (req, res, next) => {
  try {
    const floors = await getAllFloors();
    res.status(200).json({
      success: true,
      floors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single resource by ID
 * @route   GET /api/resources/:id
 * @access  Private
 */
const getSingleResource = async (req, res, next) => {
  try {
    const resource = await getResourceById(req.params.id);
    if (!resource) {
      throw new ApiError(404, 'Resource not found.');
    }

    res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live availability and booked intervals for a resource on a given date
 * @route   GET /api/resources/:id/availability?date=YYYY-MM-DD
 * @access  Private
 */
const getResourceAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD.');
    }

    const resource = await getResourceById(id);
    if (!resource) {
      throw new ApiError(404, 'Resource not found.');
    }

    const bookedIntervals = await getResourceBookingsByDate(id, date);

    // Map standard hourly slots using the exact overlap condition:
    // existing.start_time < requested.end_time AND existing.end_time > requested.start_time
    const slots = STANDARD_SLOTS.map((slot) => {
      if (resource.status !== 'ACTIVE') {
        return { ...slot, available: false, reason: resource.status };
      }

      const isOverlapping = bookedIntervals.some(
        (b) => b.start_time < slot.end && b.end_time > slot.start
      );

      return {
        ...slot,
        available: !isOverlapping,
        reason: isOverlapping ? 'BOOKED' : 'AVAILABLE',
      };
    });

    res.status(200).json({
      success: true,
      resource,
      date,
      isResourceActive: resource.status === 'ACTIVE',
      bookedIntervals,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new resource
 * @route   POST /api/resources
 * @access  Private (ADMIN only)
 */
const addResource = async (req, res, next) => {
  try {
    const {
      resource_code,
      resource_name,
      resource_type,
      description,
      building,
      floor_number,
      room_number,
      capacity = 1,
      status = 'ACTIVE',
    } = req.body;

    if (!resource_code || !resource_name || !resource_type || !building || floor_number === undefined || !room_number) {
      throw new ApiError(
        400,
        'resource_code, resource_name, resource_type, building, floor_number, and room_number are required.'
      );
    }

    if (!VALID_TYPES.includes(resource_type.toUpperCase())) {
      throw new ApiError(400, `Invalid resource_type. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (!VALID_STATUSES.includes(status.toUpperCase())) {
      throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const existing = await getResourceByCode(resource_code);
    if (existing) {
      throw new ApiError(409, `Resource code '${resource_code.toUpperCase()}' already exists.`);
    }

    const newId = await createResource({
      resourceCode: resource_code,
      resourceName: resource_name,
      resourceType: resource_type,
      description,
      building,
      floorNumber: floor_number,
      roomNumber: room_number,
      capacity,
      status,
    });

    const createdResource = await getResourceById(newId);

    await logAudit({
      userId: req.user.id,
      action: `RESOURCE_CREATED_${createdResource.resource_code}`,
      entityType: 'RESOURCE',
      entityId: newId,
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully.',
      resource: createdResource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing resource
 * @route   PUT /api/resources/:id
 * @access  Private (ADMIN only)
 */
const editResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingResource = await getResourceById(id);

    if (!existingResource) {
      throw new ApiError(404, 'Resource not found.');
    }

    const {
      resource_code = existingResource.resource_code,
      resource_name = existingResource.resource_name,
      resource_type = existingResource.resource_type,
      description = existingResource.description,
      building = existingResource.building,
      floor_number = existingResource.floor_number,
      room_number = existingResource.room_number,
      capacity = existingResource.capacity,
      status = existingResource.status,
    } = req.body;

    if (!VALID_TYPES.includes(resource_type.toUpperCase())) {
      throw new ApiError(400, `Invalid resource_type. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (!VALID_STATUSES.includes(status.toUpperCase())) {
      throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Ensure unique resource_code if changed
    if (resource_code.toUpperCase().trim() !== existingResource.resource_code) {
      const duplicate = await getResourceByCode(resource_code);
      if (duplicate) {
        throw new ApiError(409, `Resource code '${resource_code.toUpperCase()}' is already in use.`);
      }
    }

    await updateResource(id, {
      resourceCode: resource_code,
      resourceName: resource_name,
      resourceType: resource_type,
      description,
      building,
      floorNumber: floor_number,
      roomNumber: room_number,
      capacity,
      status,
    });

    const updatedResource = await getResourceById(id);

    await logAudit({
      userId: req.user.id,
      action: `RESOURCE_UPDATED_${updatedResource.resource_code}`,
      entityType: 'RESOURCE',
      entityId: Number(id),
    });

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully.',
      resource: updatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate a resource
 * @route   DELETE /api/resources/:id
 * @access  Private (ADMIN only)
 */
const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingResource = await getResourceById(id);

    if (!existingResource) {
      throw new ApiError(404, 'Resource not found.');
    }

    const result = await removeOrDeactivateResource(id);

    await logAudit({
      userId: req.user.id,
      action: `RESOURCE_${result.action}_${existingResource.resource_code}`,
      entityType: 'RESOURCE',
      entityId: Number(id),
    });

    res.status(200).json({
      success: true,
      message:
        result.action === 'DEACTIVATED'
          ? 'Resource has existing reservation history and was marked INACTIVE.'
          : 'Resource permanently deleted.',
      action: result.action,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listResources,
  listFloors,
  getSingleResource,
  getResourceAvailability,
  addResource,
  editResource,
  deleteResource,
};