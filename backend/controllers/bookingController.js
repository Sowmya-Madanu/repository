const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { 
  validateBookingDates, 
  checkCarAvailability, 
  calculateBookingPrice, 
  validateDriverLicense, 
  validateLocation 
} = require('../utils/validateBooking');

// @desc    Get all bookings for user
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('car', 'make model year images pricing location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single booking
// @route   GET /api/booking/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin or car owner
    if (booking.user._id.toString() !== req.user.id && 
        req.user.role !== 'admin' && 
        booking.car.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const {
      carId,
      startDate,
      endDate,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      paymentMethod,
      specialRequests,
      driverDetails,
      insuranceType = 'basic'
    } = req.body;

    // Validate required fields
    if (!carId || !startDate || !endDate || !startTime || !endTime || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate booking dates
    const dateValidation = validateBookingDates(startDate, endDate, startTime, endTime);
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking dates',
        errors: dateValidation.errors
      });
    }

    // Validate driver license
    const licenseValidation = validateDriverLicense(
      driverDetails?.licenseNumber, 
      driverDetails?.licenseExpiry
    );
    if (!licenseValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver license',
        errors: licenseValidation.errors
      });
    }

    // Validate locations
    const pickupValidation = validateLocation(pickupLocation, 'Pickup');
    if (!pickupValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup location',
        errors: pickupValidation.errors
      });
    }

    const dropoffValidation = validateLocation(dropoffLocation, 'Dropoff');
    if (!dropoffValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dropoff location',
        errors: dropoffValidation.errors
      });
    }

    // Check car availability
    const availabilityCheck = await checkCarAvailability(carId, startDate, endDate);
    if (!availabilityCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message: availabilityCheck.reason,
        conflictingBookings: availabilityCheck.conflictingBookings
      });
    }

    const car = availabilityCheck.car;

    // Calculate pricing
    const pricing = calculateBookingPrice(car, dateValidation.duration, insuranceType);

    // Create booking
    const bookingData = {
      user: req.user.id,
      car: carId,
      startDate,
      endDate,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      pricing: {
        basePrice: pricing.basePrice,
        taxes: pricing.taxes,
        fees: pricing.fees,
        totalPrice: pricing.totalPrice,
        currency: pricing.currency
      },
      duration: dateValidation.duration,
      paymentMethod,
      specialRequests,
      driverDetails,
      insurance: {
        isRequired: true,
        type: insuranceType,
        cost: pricing.insuranceCost
      }
    };

    const booking = await Booking.create(bookingData);

    // Populate the created booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('car', 'make model year images pricing location')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update booking
// @route   PUT /api/booking/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Check if booking can be updated
    if (['active', 'completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update booking in current status'
      });
    }

    // If updating dates, validate and check availability
    const { startDate, endDate, startTime, endTime } = req.body;
    
    if (startDate || endDate || startTime || endTime) {
      const newStartDate = startDate || booking.startDate;
      const newEndDate = endDate || booking.endDate;
      const newStartTime = startTime || booking.startTime;
      const newEndTime = endTime || booking.endTime;

      // Validate new dates
      const dateValidation = validateBookingDates(newStartDate, newEndDate, newStartTime, newEndTime);
      if (!dateValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking dates',
          errors: dateValidation.errors
        });
      }

      // Check availability (excluding current booking)
      const availabilityCheck = await checkCarAvailability(
        booking.car, 
        newStartDate, 
        newEndDate, 
        booking._id
      );
      
      if (!availabilityCheck.isAvailable) {
        return res.status(400).json({
          success: false,
          message: availabilityCheck.reason
        });
      }

      // Recalculate pricing if dates changed
      const car = await Car.findById(booking.car);
      const pricing = calculateBookingPrice(car, dateValidation.duration, booking.insurance.type);
      
      req.body.pricing = {
        basePrice: pricing.basePrice,
        taxes: pricing.taxes,
        fees: pricing.fees,
        totalPrice: pricing.totalPrice,
        currency: pricing.currency
      };
      req.body.duration = dateValidation.duration;
      req.body.insurance = {
        ...booking.insurance,
        cost: pricing.insuranceCost
      };
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('car', 'make model year images pricing location');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/booking/:id
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this time'
      });
    }

    // Calculate refund
    const refundAmount = booking.calculateRefund();

    // Update booking
    booking.status = 'cancelled';
    booking.cancellation = {
      reason: reason || 'Cancelled by user',
      cancelledAt: new Date(),
      cancelledBy: req.user.id,
      refundAmount
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      refundAmount,
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Confirm booking (by car owner or admin)
// @route   PUT /api/booking/:id/confirm
// @access  Private
const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is car owner or admin
    if (booking.car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this booking'
      });
    }

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be confirmed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Complete booking
// @route   PUT /api/booking/:id/complete
// @access  Private
const completeBooking = async (req, res) => {
  try {
    const { mileage, fuelLevel, inspection, damages } = req.body;

    const booking = await Booking.findById(req.params.id).populate('car');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is car owner or admin
    if (booking.car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this booking'
      });
    }

    // Check if booking is in active status
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active bookings can be completed'
      });
    }

    // Update booking with completion details
    booking.status = 'completed';
    booking.mileage.end = mileage;
    booking.fuel.endLevel = fuelLevel;
    booking.inspection.postRental = {
      completed: true,
      notes: inspection,
      inspector: req.user.id,
      date: new Date(),
      damages: damages || []
    };

    await booking.save();

    // Update car's total bookings
    await Car.findByIdAndUpdate(booking.car._id, {
      $inc: { totalBookings: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Booking completed successfully',
      booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Rate booking
// @route   PUT /api/booking/:id/rate
// @access  Private
const rateBooking = async (req, res) => {
  try {
    const { carRating, serviceRating, comment } = req.body;

    if (!carRating || !serviceRating) {
      return res.status(400).json({
        success: false,
        message: 'Car rating and service rating are required'
      });
    }

    const booking = await Booking.findById(req.params.id).populate('car');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed bookings can be rated'
      });
    }

    // Check if already rated
    if (booking.rating.carRating) {
      return res.status(400).json({
        success: false,
        message: 'Booking has already been rated'
      });
    }

    // Update booking rating
    booking.rating = {
      carRating,
      serviceRating,
      comment,
      ratedAt: new Date()
    };

    await booking.save();

    // Update car's average rating
    await booking.car.updateRating(carRating);

    res.status(200).json({
      success: true,
      message: 'Booking rated successfully',
      booking
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get booking price estimate
// @route   POST /api/booking-estimate
// @access  Public
const getBookingEstimate = async (req, res) => {
  try {
    const { carId, startDate, endDate, startTime, endTime, insuranceType = 'basic' } = req.body;

    if (!carId || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate dates
    const dateValidation = validateBookingDates(startDate, endDate, startTime, endTime);
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dates',
        errors: dateValidation.errors
      });
    }

    // Get car
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check availability
    const availabilityCheck = await checkCarAvailability(carId, startDate, endDate);
    
    // Calculate pricing
    const pricing = calculateBookingPrice(car, dateValidation.duration, insuranceType);

    res.status(200).json({
      success: true,
      available: availabilityCheck.isAvailable,
      availabilityReason: availabilityCheck.reason,
      pricing,
      duration: dateValidation.duration
    });
  } catch (error) {
    console.error('Get booking estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  completeBooking,
  rateBooking,
  getBookingEstimate
};