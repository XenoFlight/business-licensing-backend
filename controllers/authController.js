const User = require('../models/User');
const jwt = require('jsonwebtoken');

// יצירת טוקן JWT
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h'
  });
};

// @desc    רישום משתמש חדש (מפקח/מנהל)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, phoneNumber } = req.body;

    // בדיקה אם המשתמש קיים
    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים במערכת' });
    }

    // יצירת משתמש
    // Create user
    const user = await User.create({
      fullName,
      email,
      password, // ההצפנה מתבצעת ב-Hook במודל User
      role,
      phoneNumber
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
        message: 'המשתמש נרשם בהצלחה'
      });
    } else {
      res.status(400).json({ message: 'נתוני משתמש לא תקינים' });
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};

// @desc    התחברות למערכת וקבלת טוקן
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // בדיקת קיום משתמש
    // Check for user
    const user = await User.findOne({ where: { email } });

    // בדיקת סיסמה (שימוש במתודה מהמודל)
    // Check password
    if (user && (await user.matchPassword(password))) {
      // בדיקה אם המשתמש מאושר
      if (!user.isApproved) {
        return res.status(403).json({ message: 'החשבון שלך ממתין לאישור מנהל המערכת.' });
      }

      res.json({
        token: generateToken(user.id),
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        message: 'התחברות בוצעה בהצלחה',
      });
    } else {
      res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};

// @desc    קבלת פרטי המשתמש המחובר
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // המשתמש כבר נמצא ב-req.user דרך ה-Middleware (שניצור בהמשך)
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // לא להחזיר סיסמה
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'משתמש לא נמצא' });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};