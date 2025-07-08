import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';
import { MapPin, Users, Fuel, Settings, Star, Heart } from 'lucide-react';

const CarCard = ({ car, onFavorite, isFavorite = false }) => {
  const { formatPrice } = useCurrency();

  const defaultImage = 'https://via.placeholder.com/400x250/e5e7eb/6b7280?text=Car+Image';
  const carImage = car.images?.[0] || defaultImage;

  const features = car.features?.slice(0, 3) || [];
  
  const categoryIcons = {
    economy: '💰',
    compact: '🚗',
    midsize: '🚙',
    fullsize: '🚗',
    luxury: '✨',
    suv: '🚗',
    van: '🚐',
    convertible: '🏎️',
    sports: '🏎️'
  };

  const fuelIcons = {
    petrol: '⛽',
    diesel: '⛽',
    electric: '🔋',
    hybrid: '🔋⛽'
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={carImage}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {car.category && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {categoryIcons[car.category]} {car.category}
            </span>
          )}
          {car.status === 'rented' && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Rented
            </span>
          )}
          {!car.availability?.isAvailable && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Unavailable
            </span>
          )}
        </div>

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite(car._id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Rating */}
        {car.rating?.average > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-xs font-medium text-gray-800">
              {car.rating.average.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Car Title */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{car.location?.city}, {car.location?.state}</span>
          </div>
        </div>

        {/* Car Details */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 mr-1 text-gray-400" />
            <span>{car.seats} seats</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Fuel className="h-4 w-4 mr-1 text-gray-400" />
            <span className="capitalize">{car.fuelType}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Settings className="h-4 w-4 mr-1 text-gray-400" />
            <span className="capitalize">{car.transmission}</span>
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
              {car.features?.length > 3 && (
                <span className="text-xs text-blue-600 px-2 py-1">
                  +{car.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(car.pricing?.daily, car.pricing?.currency)}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/day</span>
            </div>
            {car.pricing?.hourly && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatPrice(car.pricing.hourly, car.pricing.currency)}/hour
              </div>
            )}
          </div>
          
          {car.totalBookings > 0 && (
            <div className="text-right">
              <div className="text-sm text-green-600 font-medium">
                {car.totalBookings} bookings
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/car/${car._id}`}
            className="btn btn-outline flex-1 text-center"
          >
            View Details
          </Link>
          {car.availability?.isAvailable && car.status === 'active' ? (
            <Link
              to={`/booking/${car._id}`}
              className="btn btn-primary flex-1 text-center"
            >
              Book Now
            </Link>
          ) : (
            <button
              disabled
              className="btn btn-secondary flex-1 opacity-50 cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;