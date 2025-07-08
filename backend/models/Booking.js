const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for booking']
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Car is required for booking']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Please provide a valid time format (HH:MM)'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Please provide a valid time format (HH:MM)'
    }
  },
  pickupLocation: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    city: {
      type: String,
      required: [true, 'Pickup city is required']
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      required: [true, 'Pickup country is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  dropoffLocation: {
    address: {
      type: String,
      required: [true, 'Dropoff address is required']
    },
    city: {
      type: String,
      required: [true, 'Dropoff city is required']
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      required: [true, 'Dropoff country is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },
    taxes: {
      type: Number,
      default: 0,
      min: [0, 'Taxes cannot be negative']
    },
    fees: {
      type: Number,
      default: 0,
      min: [0, 'Fees cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'INR'],
      default: 'USD'
    }
  },
  duration: {
    hours: {
      type: Number,
      min: [1, 'Booking must be at least 1 hour']
    },
    days: {
      type: Number,
      min: [0, 'Days cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded', 'partially-refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['credit-card', 'debit-card', 'paypal', 'cash', 'bank-transfer'],
    required: [true, 'Payment method is required']
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  driverDetails: {
    licenseNumber: {
      type: String,
      required: [true, 'Driver license number is required']
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'Driver license expiry is required']
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  insurance: {
    isRequired: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      enum: ['basic', 'comprehensive', 'premium'],
      default: 'basic'
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Insurance cost cannot be negative']
    }
  },
  mileage: {
    start: {
      type: Number,
      min: [0, 'Start mileage cannot be negative']
    },
    end: {
      type: Number,
      min: [0, 'End mileage cannot be negative']
    },
    limit: {
      type: Number,
      default: 0,
      min: [0, 'Mileage limit cannot be negative']
    },
    overageFee: {
      type: Number,
      default: 0,
      min: [0, 'Overage fee cannot be negative']
    }
  },
  fuel: {
    startLevel: {
      type: String,
      enum: ['empty', 'quarter', 'half', 'three-quarter', 'full'],
      default: 'full'
    },
    endLevel: {
      type: String,
      enum: ['empty', 'quarter', 'half', 'three-quarter', 'full']
    },
    refuelCost: {
      type: Number,
      default: 0,
      min: [0, 'Refuel cost cannot be negative']
    }
  },
  inspection: {
    preRental: {
      completed: {
        type: Boolean,
        default: false
      },
      notes: String,
      images: [String],
      inspector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: Date
    },
    postRental: {
      completed: {
        type: Boolean,
        default: false
      },
      notes: String,
      images: [String],
      inspector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: Date,
      damages: [{
        description: String,
        cost: Number,
        images: [String]
      }]
    }
  },
  rating: {
    carRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    serviceRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    ratedAt: Date
  },
  notifications: {
    confirmation: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    reminder: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    completion: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    }
  },
  cancellation: {
    reason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    }
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
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ car: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ status: 1, startDate: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function() {
  const start = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const end = new Date(`${this.endDate.toDateString()} ${this.endTime}`);
  return Math.ceil((end - start) / (1000 * 60 * 60));
});

// Validate that end date/time is after start date/time
bookingSchema.pre('save', function(next) {
  const start = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const end = new Date(`${this.endDate.toDateString()} ${this.endTime}`);
  
  if (end <= start) {
    return next(new Error('End date/time must be after start date/time'));
  }
  
  // Calculate duration
  const durationMs = end - start;
  this.duration.hours = Math.ceil(durationMs / (1000 * 60 * 60));
  this.duration.days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const startDateTime = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60);
  
  return this.status === 'pending' || this.status === 'confirmed' && hoursUntilStart > 24;
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const startDateTime = new Date(`${this.startDate.toDateString()} ${this.startTime}`);
  const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60);
  
  // Full refund if cancelled 48+ hours before
  if (hoursUntilStart >= 48) return this.pricing.totalPrice;
  
  // 50% refund if cancelled 24-48 hours before
  if (hoursUntilStart >= 24) return this.pricing.totalPrice * 0.5;
  
  // No refund if cancelled less than 24 hours before
  return 0;
};

module.exports = mongoose.model('Booking', bookingSchema);