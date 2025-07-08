const Booking = require('../models/Booking');
const Car = require('../models/Car');

const validateBookingDates = (startDate, endDate, startTime, endTime) => {
  const errors = [];

  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const now = new Date();

  // Check if start date is in the future
  if (start <= now) {
    errors.push('Start date and time must be in the future');
  }

  // Check if end date is after start date
  if (end <= start) {
    errors.push('End date and time must be after start date and time');
  }

  // Check if booking is at least 1 hour
  const durationHours = (end - start) / (1000 * 60 * 60);
  if (durationHours < 1) {
    errors.push('Booking must be at least 1 hour long');
  }

  // Check if booking is not more than 30 days
  const durationDays = durationHours / 24;
  if (durationDays > 30) {
    errors.push('Booking cannot be more than 30 days long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    duration: {
      hours: Math.ceil(durationHours),
      days: Math.ceil(durationDays)
    }
  };
};

const checkCarAvailability = async (carId, startDate, endDate, excludeBookingId = null) => {
  try {
    // Get the car
    const car = await Car.findById(carId);
    if (!car) {
      return {
        isAvailable: false,
        reason: 'Car not found'
      };
    }

    // Check if car is active
    if (car.status !== 'active') {
      return {
        isAvailable: false,
        reason: `Car is currently ${car.status}`
      };
    }

    // Check if car is generally available
    if (!car.availability.isAvailable) {
      return {
        isAvailable: false,
        reason: 'Car is not available for booking'
      };
    }

    // Check car's unavailable dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check predefined unavailable dates
    const hasUnavailableDatesConflict = car.availability.unavailableDates.some(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return (start <= periodEnd && end >= periodStart);
    });

    if (hasUnavailableDatesConflict) {
      return {
        isAvailable: false,
        reason: 'Car is not available for the selected dates'
      };
    }

    // Check maintenance schedule
    const hasMaintenanceConflict = car.availability.maintenanceSchedule.some(maintenance => {
      const maintStart = new Date(maintenance.startDate);
      const maintEnd = new Date(maintenance.endDate);
      return (start <= maintEnd && end >= maintStart);
    });

    if (hasMaintenanceConflict) {
      return {
        isAvailable: false,
        reason: 'Car is scheduled for maintenance during the selected dates'
      };
    }

    // Check existing bookings
    const query = {
      car: carId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    };

    // Exclude current booking if updating
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await Booking.find(query);

    if (conflictingBookings.length > 0) {
      return {
        isAvailable: false,
        reason: 'Car is already booked for the selected dates',
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime
        }))
      };
    }

    return {
      isAvailable: true,
      car
    };
  } catch (error) {
    return {
      isAvailable: false,
      reason: 'Error checking availability'
    };
  }
};

const calculateBookingPrice = (car, duration, insuranceType = 'basic') => {
  const { hours, days } = duration;
  
  let basePrice = 0;

  // Calculate base price based on duration
  if (days >= 7) {
    // Weekly rate
    const weeks = Math.ceil(days / 7);
    basePrice = car.pricing.weekly ? weeks * car.pricing.weekly : weeks * 7 * car.pricing.daily;
  } else if (days >= 1) {
    // Daily rate
    basePrice = days * car.pricing.daily;
    // Add partial day if hours exceed full days
    const extraHours = hours % 24;
    if (extraHours > 0) {
      basePrice += extraHours * car.pricing.hourly;
    }
  } else {
    // Hourly rate
    basePrice = hours * car.pricing.hourly;
  }

  // Calculate insurance cost
  let insuranceCost = 0;
  const insuranceRates = {
    basic: 0.05,     // 5% of base price
    comprehensive: 0.10, // 10% of base price
    premium: 0.15    // 15% of base price
  };

  insuranceCost = basePrice * (insuranceRates[insuranceType] || insuranceRates.basic);

  // Calculate taxes (assuming 10% tax rate)
  const taxRate = 0.10;
  const taxes = (basePrice + insuranceCost) * taxRate;

  // Calculate fees (flat fee based on duration)
  const fees = days >= 1 ? 25 : 10; // $25 for daily+ bookings, $10 for hourly

  const totalPrice = basePrice + insuranceCost + taxes + fees;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    insuranceCost: Math.round(insuranceCost * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    fees,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: car.pricing.currency,
    breakdown: {
      duration: `${days} days, ${hours % 24} hours`,
      rate: days >= 1 ? `$${car.pricing.daily}/day` : `$${car.pricing.hourly}/hour`,
      insurance: `${insuranceType} (${Math.round(insuranceRates[insuranceType] * 100)}%)`,
      taxRate: `${Math.round(taxRate * 100)}%`
    }
  };
};

const validateDriverLicense = (licenseNumber, licenseExpiry) => {
  const errors = [];

  if (!licenseNumber || licenseNumber.trim().length === 0) {
    errors.push('Driver license number is required');
  }

  if (!licenseExpiry) {
    errors.push('Driver license expiry date is required');
  } else {
    const expiryDate = new Date(licenseExpiry);
    const now = new Date();
    
    if (expiryDate <= now) {
      errors.push('Driver license has expired');
    }

    // Check if license expires within 30 days of booking start
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (expiryDate <= thirtyDaysFromNow) {
      errors.push('Driver license expires too soon for this booking');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLocation = (location, type) => {
  const errors = [];

  if (!location.address || location.address.trim().length === 0) {
    errors.push(`${type} address is required`);
  }

  if (!location.city || location.city.trim().length === 0) {
    errors.push(`${type} city is required`);
  }

  if (!location.country || location.country.trim().length === 0) {
    errors.push(`${type} country is required`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateBookingDates,
  checkCarAvailability,
  calculateBookingPrice,
  validateDriverLicense,
  validateLocation
};