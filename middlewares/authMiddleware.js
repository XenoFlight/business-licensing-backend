const jwt = require('jsonwebtoken');
const User = require('../models/User');

// אימות משתמש (בדיקת טוקן)
// Protect routes - Verify Token
exports.protect = async (req, res, next) => {
  let token;

  // בדיקה אם הכותרת קיימת ומתחילה ב-Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // קבלת הטוקן מהכותרת (הסרת המילה Bearer)
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // אימות הטוקן מול הסוד
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // מציאת המשתמש והוספתו לאובייקט הבקשה (ללא סיסמה)
      // Get user from the token
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        return res.status(401).json({ message: 'המשתמש לא נמצא, ההרשאה נדחתה' });
      }

      return next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ message: 'לא מורשה, טוקן לא תקין' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'לא מורשה, לא התקבל טוקן' });
  }
};

// הרשאות לפי תפקיד (למשל: רק מנהל יכול למחוק)
// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'לא מורשה, משתמש לא מזוהה' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `תפקיד המשתמש (${req.user.role}) אינו מורשה לבצע פעולה זו`
      });
    }
    next();
  };
};