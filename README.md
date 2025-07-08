# 🚗 Car Rental Booking System

A comprehensive fullstack car rental booking system built with **Node.js**, **Express**, **React**, and **MongoDB**. This modern application allows users to browse, book, and manage car rentals with a beautiful and intuitive interface.

## ✨ Features

### 🌍 **Frontend Features (React)**
- **Modern UI/UX** with responsive design
- **Dark/Light Theme** support with localStorage persistence
- **Multi-Currency Support** (USD, EUR, INR) with real-time conversion
- **Advanced Car Search** with filters and sorting
- **Interactive Car Booking** with date/time pickers
- **User Dashboard** for managing bookings and profile
- **Real-time Availability** checking
- **Booking Management** (view, modify, cancel)
- **Car Owner Portal** for adding and managing cars
- **Rating and Review System**

### 🔧 **Backend Features (Node.js + Express)**
- **RESTful API** with comprehensive endpoints
- **JWT Authentication** via HTTP-only cookies
- **Role-based Authorization** (User, Admin)
- **MongoDB Integration** with Mongoose ODM
- **Advanced Validation** with comprehensive error handling
- **Rate Limiting** and security middleware
- **Booking Management** with availability checking
- **Price Calculation** with dynamic pricing
- **Car Management** with owner verification
- **Review and Rating System**

### 🛡️ **Security & Performance**
- **HTTP-only Cookies** for secure authentication
- **CORS Configuration** for cross-origin requests
- **Input Validation** and sanitization
- **Rate Limiting** to prevent abuse
- **Error Handling** with proper status codes
- **Database Indexing** for optimized queries

## 🏗️ **Project Structure**

```
car-rental-booking-system/
├── backend/                    # Backend API
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── carController.js
│   │   └── bookingController.js
│   ├── models/               # Mongoose models
│   │   ├── User.js
│   │   ├── Car.js
│   │   └── Booking.js
│   ├── routes/               # API routes
│   │   ├── authRoutes.js
│   │   ├── carRoutes.js
│   │   └── bookingRoutes.js
│   └── utils/                # Utility functions
│       ├── authMiddleware.js
│       └── validateBooking.js
├── frontend/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/       # Reusable components
│       ├── contexts/         # React contexts
│       ├── hooks/           # Custom hooks
│       └── pages/           # Page components
├── build/                    # React build (generated)
├── index.js                 # Express server entry
├── package.json
├── .env                     # Environment variables
└── README.md
```

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd car-rental-booking-system
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/car-rental-db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-key-change-this-too
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### 3. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Start Development Servers

#### Option A: Run Backend and Frontend Separately
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend development server
npm run frontend
```

#### Option B: Use the Setup Script
```bash
# Install all dependencies
npm run setup

# Start backend
npm run backend
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📚 **API Documentation**

### Authentication Endpoints
```
POST   /api/register         # User registration
POST   /api/login           # User login
POST   /api/logout          # User logout
GET    /api/user            # Get current user
PUT    /api/user            # Update user profile
PUT    /api/change-password # Change password
GET    /api/check-auth      # Check auth status
```

### Car Endpoints
```
GET    /api/cars            # Get all cars (with filters)
GET    /api/car/:id         # Get single car
POST   /api/car            # Create new car (auth required)
PUT    /api/car/:id        # Update car (owner/admin)
DELETE /api/car/:id        # Delete car (owner/admin)
GET    /api/car/:id/availability # Check car availability
GET    /api/my-cars        # Get user's cars (auth required)
GET    /api/car-categories # Get car categories
GET    /api/car-locations  # Get available locations
```

### Booking Endpoints
```
GET    /api/bookings        # Get user bookings (auth required)
GET    /api/booking/:id     # Get single booking (auth required)
POST   /api/bookings        # Create new booking (auth required)
PUT    /api/booking/:id     # Update booking (auth required)
DELETE /api/booking/:id     # Cancel booking (auth required)
PUT    /api/booking/:id/confirm   # Confirm booking (owner/admin)
PUT    /api/booking/:id/complete  # Complete booking (owner/admin)
PUT    /api/booking/:id/rate      # Rate booking (auth required)
POST   /api/booking-estimate      # Get booking price estimate
```

## 🔧 **Key Components**

### Custom React Hook: `useCarSearch`
```javascript
import useCarSearch from './hooks/useCarSearch';

const { 
  results, 
  loading, 
  updateQuery, 
  updateFilters,
  pagination 
} = useCarSearch();
```

### Contexts
- **AuthContext**: User authentication and session management
- **ThemeContext**: Dark/light theme with localStorage persistence
- **CurrencyContext**: Multi-currency support with conversion

### Core Components
- **CarCard**: Display car information with pricing and actions
- **BookingForm**: Interactive booking form with validation
- **Navbar**: Navigation with theme toggle and currency selector
- **ProtectedRoute**: Route protection for authenticated users

## 🏃‍♂️ **Available Scripts**

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run build      # Build React app for production
npm run setup      # Install all dependencies
npm run frontend   # Start React development server
npm run backend    # Start backend development server
```

## 🌐 **Deployment**

### Deploy to Render (Recommended)

1. **Prepare for Deployment**
   ```bash
   npm run build
   ```

2. **Environment Variables**
   Set these in your Render dashboard:
   ```
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-production-jwt-secret
   SESSION_SECRET=your-production-session-secret
   ```

3. **Deploy**
   - Point Render to your repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`

### Deploy to Heroku

1. **Install Heroku CLI** and login
2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGO_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## 🗃️ **Database Schema**

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: ['user', 'admin'],
  preferences: {
    currency: ['USD', 'EUR', 'INR'],
    theme: ['light', 'dark']
  },
  // ... additional fields
}
```

### Car Model
```javascript
{
  make: String,
  model: String,
  year: Number,
  category: ['economy', 'luxury', 'suv', ...],
  pricing: {
    hourly: Number,
    daily: Number,
    currency: String
  },
  location: {
    city: String,
    state: String,
    coordinates: { latitude, longitude }
  },
  availability: {
    isAvailable: Boolean,
    unavailableDates: [{ startDate, endDate }]
  },
  // ... additional fields
}
```

### Booking Model
```javascript
{
  user: ObjectId (ref: User),
  car: ObjectId (ref: Car),
  startDate: Date,
  endDate: Date,
  startTime: String,
  endTime: String,
  pricing: {
    basePrice: Number,
    totalPrice: Number,
    currency: String
  },
  status: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
  // ... additional fields
}
```

## 🔐 **Security Features**

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** with bcryptjs
- **Input Validation** with Mongoose validators
- **Rate Limiting** to prevent API abuse
- **CORS Configuration** for secure cross-origin requests
- **Helmet.js** for security headers
- **Environment Variables** for sensitive data

## 🎨 **UI Features**

- **Responsive Design** for all screen sizes
- **Dark/Light Theme** with smooth transitions
- **Modern CSS** with CSS custom properties
- **Loading States** and error handling
- **Interactive Forms** with real-time validation
- **Toast Notifications** for user feedback
- **Modal Components** for better UX

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🚀 **Future Enhancements**

- [ ] **Payment Integration** (Stripe, PayPal)
- [ ] **Real-time Chat** for customer support
- [ ] **Mobile App** (React Native)
- [ ] **Advanced Analytics** dashboard
- [ ] **Email Notifications** for bookings
- [ ] **GPS Tracking** for car locations
- [ ] **Insurance Integration**
- [ ] **Multi-language Support**

---

**Built with ❤️ by the Car Rental Team**