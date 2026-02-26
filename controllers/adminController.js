const User = require('../models/User');

// @desc    קבלת משתמשים הממתינים לאישור
// @route   GET /api/admin/pending-users
// @access  Private (Admin only)
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isApproved: false },
      attributes: ['id', 'fullName', 'email', 'role', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};

// @desc    אישור משתמש
// @route   PUT /api/admin/approve/:id
// @access  Private (Admin only)
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    user.isApproved = true;
    await user.save();

    res.json({ 
      message: 'המשתמש אושר בהצלחה', 
      user: { id: user.id, fullName: user.fullName, email: user.email, isApproved: true } 
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'שגיאה באישור המשתמש', error: error.message });
  }
};

// @desc    דחיית משתמש (מחיקה)
// @route   DELETE /api/admin/deny/:id
// @access  Private (Admin only)
exports.denyUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }
    await user.destroy(); // מחיקת המשתמש מהמערכת
    res.json({ message: 'המשתמש נדחה ונמחק מהמערכת' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בדחיית המשתמש', error: error.message });
  }
};