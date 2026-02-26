const express = require('express');
const router = express.Router();
const {
  createReport,
  getReportsByBusiness,
  getReportById,
  updateReport,
  getAllReports
} = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// הגדרת נתיבים לדו"חות ביקורת
// Report Routes

router.route('/')
  .post(protect, authorize('inspector', 'manager', 'admin'), createReport) // יצירת דו"ח
  .get(protect, authorize('inspector', 'manager', 'admin'), getAllReports); // קבלת כל הדו"חות (לוח ביקורות)

router.route('/business/:businessId')
  .get(protect, getReportsByBusiness); // קבלת היסטוריית דו"חות לעסק

router.route('/:id')
  .get(protect, getReportById) // צפייה בדו"ח ספציפי
  .put(protect, authorize('inspector', 'manager', 'admin'), updateReport); // עדכון דו"ח

module.exports = router;