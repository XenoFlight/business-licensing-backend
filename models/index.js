const { sequelize } = require('../config/db');
const User = require('./User');
const Business = require('./Business');
const LicensingItem = require('./LicensingItem');
const Report = require('./Report');
const InspectionDefect = require('./InspectionDefect');

// הגדרת קשרים (Associations)

// קשר בין פריט רישוי לעסקים (1:N)
// Licensing Item has many Businesses
// LicensingItem.hasMany(Business, { foreignKey: 'licensingItemId' });
// Business.belongsTo(LicensingItem, { foreignKey: 'licensingItemId' });

// קשר בין עסק לדו"חות (1:N)
// Business has many Reports
Business.hasMany(Report, { foreignKey: 'businessId' });
Report.belongsTo(Business, { foreignKey: 'businessId' });

// קשר בין מפקח לדו"חות (1:N)
// Inspector (User) has many Reports
User.hasMany(Report, { foreignKey: 'inspectorId' });
Report.belongsTo(User, { foreignKey: 'inspectorId', as: 'inspector' });

module.exports = {
  sequelize,
  User,
  Business,
  LicensingItem,
  Report,
  InspectionDefect
};