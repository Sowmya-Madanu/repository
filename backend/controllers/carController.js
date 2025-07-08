const Car = require('../models/Car');
const Booking = require('../models/Booking');

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
const getCars = async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      seats,
      available,
      startDate,
      endDate,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Text search
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Location filter
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.daily'] = {};
      if (minPrice) query['pricing.daily'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.daily'].$lte = Number(maxPrice);
    }

    // Transmission filter
    if (transmission) {
      query.transmission = transmission;
    }

    // Fuel type filter
    if (fuelType) {
      query.fuelType = fuelType;
    }

    // Seats filter
    if (seats) {
      query.seats = { $gte: Number(seats) };
    }

    // Availability filter
    if (available === 'true') {
      query['availability.isAvailable'] = true;
      query.status = 'active';
    }

    // Date availability filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Find cars that don't have conflicting bookings
      const conflictingBookings = await Booking.find({
        status: { $in: ['pending', 'confirmed', 'active'] },
        $or: [
          {
            startDate: { $lte: end },
            endDate: { $gte: start }
          }
        ]
      }).distinct('car');

      query._id = { $nin: conflictingBookings };

      // Also exclude cars with unavailable dates
      query['availability.unavailableDates'] = {
        $not: {
          $elemMatch: {
            startDate: { $lte: end },
            endDate: { $gte: start }
          }
        }
      };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const cars = await Car.find(query)
      .populate('owner', 'name email phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Car.countDocuments(query);

    res.status(200).json({
      success: true,
      count: cars.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      cars
    });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single car
// @route   GET /api/car/:id
// @access  Public
const getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('owner', 'name email phone');

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Get recent bookings for this car (for reviews/ratings)
    const recentBookings = await Booking.find({
      car: car._id,
      status: 'completed',
      'rating.carRating': { $exists: true }
    })
      .populate('user', 'name')
      .select('rating user createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      car,
      reviews: recentBookings
    });
  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new car
// @route   POST /api/car
// @access  Private (Admin or Car Owner)
const createCar = async (req, res) => {
  try {
    // Add user as the owner
    req.body.owner = req.user.id;

    const car = await Car.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      car
    });
  } catch (error) {
    console.error('Create car error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Car with this license plate already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update car
// @route   PUT /api/car/:id
// @access  Private (Owner or Admin)
const updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership or admin role
    if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this car'
      });
    }

    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    console.error('Update car error:', error);

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

// @desc    Delete car
// @route   DELETE /api/car/:id
// @access  Private (Owner or Admin)
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership or admin role
    if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this car'
      });
    }

    // Check if car has active bookings
    const activeBookings = await Booking.find({
      car: car._id,
      status: { $in: ['pending', 'confirmed', 'active'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete car with active bookings'
      });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get car availability
// @route   GET /api/car/:id/availability
// @access  Public
const getCarAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check availability
    const isAvailable = car.isAvailableForDates(startDate, endDate);

    // Get conflicting bookings if any
    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflictingBookings = await Booking.find({
      car: car._id,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    }).select('startDate endDate startTime endTime status');

    res.status(200).json({
      success: true,
      available: isAvailable,
      conflictingBookings
    });
  } catch (error) {
    console.error('Get car availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get cars by owner
// @route   GET /api/my-cars
// @access  Private
const getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      cars
    });
  } catch (error) {
    console.error('Get my cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get car categories
// @route   GET /api/car-categories
// @access  Public
const getCarCategories = async (req, res) => {
  try {
    const categories = await Car.distinct('category');
    
    // Get count for each category
    const categoryCounts = await Car.aggregate([
      { $match: { status: 'active', 'availability.isAvailable': true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoriesWithCounts = categories.map(category => {
      const categoryData = categoryCounts.find(c => c._id === category);
      return {
        name: category,
        count: categoryData ? categoryData.count : 0
      };
    });

    res.status(200).json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get car categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get car locations
// @route   GET /api/car-locations
// @access  Public
const getCarLocations = async (req, res) => {
  try {
    const locations = await Car.aggregate([
      { $match: { status: 'active', 'availability.isAvailable': true } },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state',
            country: '$location.country'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const formattedLocations = locations.map(loc => ({
      city: loc._id.city,
      state: loc._id.state,
      country: loc._id.country,
      count: loc.count,
      display: `${loc._id.city}, ${loc._id.state}, ${loc._id.country}`
    }));

    res.status(200).json({
      success: true,
      locations: formattedLocations
    });
  } catch (error) {
    console.error('Get car locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  getCarAvailability,
  getMyCars,
  getCarCategories,
  getCarLocations
};