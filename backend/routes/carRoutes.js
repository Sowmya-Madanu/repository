const express = require('express');
const {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  getCarAvailability,
  getMyCars,
  getCarCategories,
  getCarLocations
} = require('../controllers/carController');
const { protect, authorize, optionalAuth } = require('../utils/authMiddleware');

const router = express.Router();

// Public routes
router.get('/cars', optionalAuth, getCars);
router.get('/car/:id', getCar);
router.get('/car/:id/availability', getCarAvailability);
router.get('/car-categories', getCarCategories);
router.get('/car-locations', getCarLocations);

// Protected routes
router.post('/car', protect, createCar);
router.put('/car/:id', protect, updateCar);
router.delete('/car/:id', protect, deleteCar);
router.get('/my-cars', protect, getMyCars);

module.exports = router;