const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// מודל דו"ח ביקורת (Inspection Report)
// Represents an on-site inspection report
const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'מזהה העסק שנבדק (Foreign Key)' // Business ID
  },
  inspectorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'מזהה המפקח שביצע את הביקורת (Foreign Key)' // Inspector ID
  },
  visitDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'תאריך ושעת הביקורת' // Visit Date
  },
  findings: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'פירוט הליקויים והממצאים בביקורת' // Findings / Defects
  },
  status: {
    type: DataTypes.ENUM('pass', 'fail', 'conditional_pass'),
    defaultValue: 'fail',
  },
  aiRiskAssessment: {
    type: DataTypes.JSON, // PostgreSQL תומך ב-JSON
    allowNull: true,
    comment: 'ניתוח סיכונים אוטומטי ע"י Gemini AI' // AI Risk Analysis
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'נתיב לקובץ ה-PDF המופק' // Path to generated PDF
  }
}, {
  tableName: 'reports',
  timestamps: true // createdAt, updatedAt
});

module.exports = Report;