const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  completeBooking,
  rateBooking,
  getBookingEstimate
} = require('../controllers/bookingController');
const { protect, optionalAuth } = require('../utils/authMiddleware');

const router = express.Router();

// Public routes
router.post('/booking-estimate', optionalAuth, getBookingEstimate);

// Protected routes
router.get('/bookings', protect, getBookings);
router.get('/booking/:id', protect, getBooking);
router.post('/bookings', protect, createBooking);
router.put('/booking/:id', protect, updateBooking);
router.delete('/booking/:id', protect, cancelBooking);
router.put('/booking/:id/confirm', protect, confirmBooking);
router.put('/booking/:id/complete', protect, completeBooking);
router.put('/booking/:id/rate', protect, rateBooking);

module.exports = router;