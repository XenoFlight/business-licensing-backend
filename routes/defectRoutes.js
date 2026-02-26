const express = require('express');
const router = express.Router();
const { getAllDefects, getDefectById } = require('../controllers/defectController');
const { protect } = require('../middlewares/authMiddleware');

// הגדרת נתיבים לליקויים
// Defect Routes

router.route('/')
  .get(protect, getAllDefects); // קבלת כל הליקויים (קטלוג)

router.route('/:id')
  .get(protect, getDefectById); // קבלת ליקוי ספציפי

module.exports = router;