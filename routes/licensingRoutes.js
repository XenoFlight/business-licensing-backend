const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/licensingController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// הגדרת נתיבים לפריטי רישוי
// Licensing Items Routes

// נתיבים ציבוריים (או מוגנים למשתמשים מחוברים)
router.route('/')
  .get(getAllItems)
  .post(protect, authorize('admin', 'manager'), createItem);

router.route('/:id')
  .get(getItemById)
  .put(protect, authorize('admin', 'manager'), updateItem)
  .delete(protect, authorize('admin'), deleteItem); // רק אדמין יכול למחוק

module.exports = router;