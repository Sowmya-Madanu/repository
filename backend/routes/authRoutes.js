const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  checkAuth
} = require('../controllers/authController');
const { protect } = require('../utils/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/check-auth', checkAuth);

// Protected routes
router.post('/logout', protect, logout);
router.get('/user', protect, getMe);
router.put('/user', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;