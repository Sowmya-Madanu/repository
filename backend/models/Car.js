const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Car make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Car model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Car year is required'],
    min: [1990, 'Car year must be 1990 or later'],
    max: [new Date().getFullYear() + 1, 'Car year cannot be in the future']
  },
  color: {
    type: String,
    required: [true, 'Car color is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Car category is required'],
    enum: ['economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'van', 'convertible', 'sports'],
    lowercase: true
  },
  transmission: {
    type: String,
    required: [true, 'Transmission type is required'],
    enum: ['manual', 'automatic'],
    lowercase: true
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    lowercase: true
  },
  seats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: [2, 'Car must have at least 2 seats'],
    max: [15, 'Car cannot have more than 15 seats']
  },
  doors: {
    type: Number,
    required: [true, 'Number of doors is required'],
    min: [2, 'Car must have at least 2 doors'],
    max: [6, 'Car cannot have more than 6 doors']
  },
  features: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  }],
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  mileage: {
    type: Number,
    required: [true, 'Car mileage is required'],
    min: [0, 'Mileage cannot be negative']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Car location address is required']
    },
    city: {
      type: String,
      required: [true, 'Car location city is required']
    },
    state: {
      type: String,
      required: [true, 'Car location state is required']
    },
    country: {
      type: String,
      required: [true, 'Car location country is required']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Invalid latitude'],
        max: [90, 'Invalid latitude']
      },
      longitude: {
        type: Number,
        min: [-180, 'Invalid longitude'],
        max: [180, 'Invalid longitude']
      }
    }
  },
  pricing: {
    hourly: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative']
    },
    daily: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: [0, 'Daily rate cannot be negative']
    },
    weekly: {
      type: Number,
      min: [0, 'Weekly rate cannot be negative']
    },
    monthly: {
      type: Number,
      min: [0, 'Monthly rate cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'INR'],
      default: 'USD'
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    unavailableDates: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }],
    maintenanceSchedule: [{
      startDate: Date,
      endDate: Date,
      description: String
    }]
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Car owner is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'rented'],
    default: 'active'
  },
  insurance: {
    company: String,
    policyNumber: String,
    expiryDate: Date,
    coverage: String
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: [0, 'Total bookings cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
carSchema.index({ category: 1, 'location.city': 1 });
carSchema.index({ 'pricing.daily': 1 });
carSchema.index({ 'availability.isAvailable': 1 });
carSchema.index({ make: 1, model: 1 });
carSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full car name
carSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.make} ${this.model}`;
});

// Method to check if car is available for given dates
carSchema.methods.isAvailableForDates = function(startDate, endDate) {
  if (!this.availability.isAvailable) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check unavailable dates
  const hasConflict = this.availability.unavailableDates.some(period => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    return (start <= periodEnd && end >= periodStart);
  });
  
  return !hasConflict;
};

// Update rating method
carSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;
  return this.save();
};

module.exports = mongoose.model('Car', carSchema);