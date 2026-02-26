const InspectionDefect = require('../models/InspectionDefect');

// @desc    קבלת כל סעיפי הליקויים (קטלוג)
// @route   GET /api/defects
// @access  Public (משתמשים מחוברים)
exports.getAllDefects = async (req, res) => {
  try {
    const defects = await InspectionDefect.findAll({
      order: [['id', 'ASC']]
    });
    res.json(defects);
  } catch (error) {
    console.error('Error fetching defects:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת רשימת ליקויים', error: error.message });
  }
};

// @desc    קבלת ליקוי ספציפי לפי מזהה
// @route   GET /api/defects/:id
// @access  Public
exports.getDefectById = async (req, res) => {
  try {
    const defect = await InspectionDefect.findByPk(req.params.id);
    if (defect) {
      res.json(defect);
    } else {
      res.status(404).json({ message: 'ליקוי לא נמצא' });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};
