const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// מודל עסק (הישות שמבקשת/מחזיקה רישיון)
// Business Model (The entity applying for/holding the license)
const Business = sequelize.define('Business', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'שם העסק' // Business Name
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'כתובת העסק' // Business Address
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'שם בעל העסק' // Business Owner Name
  },
  ownerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'תעודת זהות/ח.פ של בעל העסק' // Owner ID / Company ID
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'טלפון ליצירת קשר' // Contact Phone
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: 'אימייל לקבלת הודעות' // Contact Email
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'מספר רישיון עסק (אם הונפק)' // Business License Number (if issued)
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'application_submitted', // placeholder; existing records use Hebrew values
    comment: 'סטטוס העסק (מחרוזת חופשית)'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'תאריך הוצאת הרישיון' // License Issue Date
  },
  expirationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'תאריך תפוגת הרישיון' // License Expiration Date
  },
  licensingItemId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'מזהה פריט רישוי (מקושר לטבלת licensing_items)' // Licensing Item ID
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'businesses',
  timestamps: true, // מוסיף createdAt ו-updatedAt
  indexes: [
    {
      unique: true,
      fields: ['licenseNumber']
    }
  ]
});

module.exports = Business;