const express = require('express');
const {
  listResources,
  listFloors,
  getSingleResource,
  getResourceAvailability,
  addResource,
  editResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All resource endpoints require authentication
router.use(protect);

// Read endpoints (available to STUDENT, FACULTY, and ADMIN)
router.get('/', listResources);
router.get('/floors', listFloors);
router.get('/:id', getSingleResource);
router.get('/:id/availability', getResourceAvailability);

// Write/Management endpoints (restricted strictly to ADMIN)
router.post('/', authorizeRoles('ADMIN'), addResource);
router.put('/:id', authorizeRoles('ADMIN'), editResource);
router.delete('/:id', authorizeRoles('ADMIN'), deleteResource);

module.exports = router;