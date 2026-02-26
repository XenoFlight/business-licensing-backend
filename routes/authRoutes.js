const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// נתיבי אימות
// Auth Routes

// @route   POST /api/auth/register
// @desc    רישום משתמש חדש
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    התחברות וקבלת טוקן
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    קבלת פרטי המשתמש המחובר (מוגן)
router.get('/me', protect, getMe);

module.exports = router;