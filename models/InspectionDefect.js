const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// מודל פריטי ליקויים (קטלוג ליקויים לביקורת)
// Inspection Defect Model (Catalog of possible defects)
const InspectionDefect = sequelize.define('InspectionDefect', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'קטגוריה (למשל: בטיחות אש, תברואה)' // Category
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'נושא הליקוי' // Subject
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'תיאור מלא של הליקוי והסעיף בחוק' // Description
  }
}, {
  tableName: 'inspection_defects',
  timestamps: false // טבלה סטטית (קטלוג)
});

module.exports = InspectionDefect;
