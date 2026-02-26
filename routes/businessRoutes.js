const express = require('express');
const router = express.Router();
const {
  getAllBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessReports,
  updateBusinessStatus,
  updateBusinessLocation
} = require('../controllers/businessController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// הגדרת נתיבים לעסקים
// Business Routes

router.route('/')
  .get(protect, getAllBusinesses) // צפייה ברשימת עסקים (למשתמשים רשומים)
  .post(protect, authorize('manager', 'inspector', 'admin'), createBusiness); // יצירת עסק

router.get('/:id/reports', protect, getBusinessReports); // קבלת היסטוריית ביקורות לעסק
router.patch('/:id/status', protect, authorize('manager', 'inspector', 'admin'), updateBusinessStatus); // עדכון סטטוס עסק
router.patch('/:id/location', protect, authorize('manager', 'inspector', 'admin'), updateBusinessLocation); // עדכון מיקום עסק

router.route('/:id')
  .get(protect, getBusinessById) // צפייה בפרטי עסק
  .put(protect, authorize('manager', 'admin'), updateBusiness) // עדכון פרטי עסק
  .delete(protect, authorize('admin'), deleteBusiness); // מחיקת עסק (אדמין בלבד)

module.exports = router;