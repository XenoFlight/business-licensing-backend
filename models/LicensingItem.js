const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// מודל פריט רישוי (לפי צו רישוי עסקים)
// Licensing Item Model (According to Business Licensing Order)
const LicensingItem = sequelize.define('LicensingItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  itemNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'מספר פריט רישוי (לדוגמה: 4.2א)' // Licensing Item Number (e.g., 4.2a)
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'שם פריט הרישוי' // Item Name
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'תיאור הפעילות העסקית' // Business Activity Description
  },
  licensingTrack: {
    type: DataTypes.ENUM('regular', 'expedited_a', 'expedited_b', 'affidavit'),
    defaultValue: 'regular',
  },
  // גורמי אישור נדרשים (Approval Bodies)
  needsPoliceApproval: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'האם נדרש אישור משטרה' // Police Approval Required
  },
  needsFireDeptApproval: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // לרוב נדרש
    comment: 'האם נדרש אישור כבאות' // Fire Dept Approval Required
  },
  needsHealthMinistryApproval: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'האם נדרש אישור משרד הבריאות' // Health Ministry Approval Required
  },
  needsEnvironmentalProtectionApproval: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'האם נדרש אישור המשרד להגנת הסביבה' // Environmental Protection Approval Required
  },
  needsAgricultureMinistryApproval: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'האם נדרש אישור משרד החקלאות' // Agriculture Ministry Approval Required
  },
  needsLaborMinistryApproval: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'האם נדרש אישור משרד העבודה' // Labor Ministry Approval Required
  },
  validityYears: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'תוקף הרישיון בשנים' // License Validity in Years
  }
}, {
  tableName: 'licensing_items',
  timestamps: false, // טבלה סטטית יחסית
  indexes: [
    {
      unique: true,
      fields: ['itemNumber']
    }
  ]
});

module.exports = LicensingItem;