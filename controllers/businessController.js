const { Business, LicensingItem, Report, User } = require('../models');

// @desc    קבלת כל העסקים
// @route   GET /api/businesses
// @access  Public/Private
exports.getAllBusinesses = async (req, res) => {
  try {
    const { name } = req.query;
    const where = {};

    if (name) {
      where.businessName = name;
    }

    // שליפת כל העסקים כולל פרטי פריט הרישוי המקושר
    const businesses = await Business.findAll({
      where,
      // LicensingItem association is currently commented out in models/index.js
      // include: [{ 
      //   model: LicensingItem, 
      //   attributes: ['itemNumber', 'name', 'licensingTrack'] 
      // }],
      order: [['createdAt', 'DESC']]
    });
    res.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת רשימת עסקים', error: error.message });
  }
};

// @desc    קבלת עסק לפי מזהה
// @route   GET /api/businesses/:id
// @access  Public/Private
exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [
        // { model: LicensingItem }, // פרטי פריט הרישוי המלאים
        { model: Report }         // היסטוריית דו"חות ביקורת
      ]
    });

    if (business) {
      res.json(business);
    } else {
      res.status(404).json({ message: 'עסק לא נמצא' });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};

// @desc    קבלת היסטוריית ביקורות לעסק
// @route   GET /api/businesses/:id/reports
// @access  Private
exports.getBusinessReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { businessId: req.params.id },
      include: [
        { 
          model: User, 
          as: 'inspector',
          attributes: ['id', 'fullName', 'email'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching business reports:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת היסטוריית ביקורות', error: error.message });
  }
};

// @desc    יצירת עסק חדש (בקשה לרישיון)
// @route   POST /api/businesses
// @access  Private (Manager/Inspector)
exports.createBusiness = async (req, res) => {
  try {
    // בדיקה שפריט הרישוי קיים
    if (req.body.licensingItemId) {
      const licensingItem = await LicensingItem.findByPk(req.body.licensingItemId);
      if (!licensingItem) {
        return res.status(400).json({ message: 'פריט רישוי לא תקין או לא נמצא' });
      }
    }

    const newBusiness = await Business.create(req.body);
    
    res.status(201).json({
      message: 'העסק נוצר בהצלחה',
      business: newBusiness
    });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(400).json({ message: 'שגיאה ביצירת עסק', error: error.message });
  }
};

// @desc    עדכון פרטי עסק
// @route   PUT /api/businesses/:id
// @access  Private (Manager)
exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (business) {
      await business.update(req.body);
      res.json({
        message: 'פרטי העסק עודכנו בהצלחה',
        business: business
      });
    } else {
      res.status(404).json({ message: 'עסק לא נמצא' });
    }
  } catch (error) {
    res.status(400).json({ message: 'שגיאה בעדכון עסק', error: error.message });
  }
};

// @desc    עדכון סטטוס עסק
// @route   PATCH /api/businesses/:id/status
// @access  Private (Manager/Inspector)
exports.updateBusinessStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const business = await Business.findByPk(req.params.id);

    if (business) {
      business.status = status;
      await business.save();
      res.json({
        message: 'סטטוס העסק עודכן בהצלחה',
        business: business
      });
    } else {
      res.status(404).json({ message: 'עסק לא נמצא' });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון סטטוס עסק', error: error.message });
  }
};

// @desc    מחיקת עסק
// @route   DELETE /api/businesses/:id
// @access  Private (Admin)
exports.deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (business) {
      await business.destroy();
      res.json({ message: 'העסק נמחק בהצלחה' });
    } else {
      res.status(404).json({ message: 'עסק לא נמצא' });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת במחיקת עסק', error: error.message });
  }
};