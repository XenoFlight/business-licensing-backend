const { Sequelize } = require('sequelize');
const path = require('path');

// טעינת משתני סביבה - מנסה לטעון מהתיקייה הנוכחית (config) אם הקובץ שם
// Load environment variables from the current directory (config) if present
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// הגדרת משתני חיבור למסד הנתונים
// Database connection variables
let sequelize;

// בדיקה האם קיימת מחרוזת חיבור מלאה (למשל Neon DB)
// Check if a full connection string is provided (e.g. Neon DB)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // נדרש לרוב ספקי הענן כמו Neon
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // הגדרת אזור זמן לישראל
    timezone: '+02:00' 
  });
} else {
  // אם רצים בסביבת ייצור וחסרה מחרוזת החיבור - זרוק שגיאה ברורה
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Environment Variables Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DB_URL: !!process.env.DATABASE_URL,
      AVAILABLE_KEYS: Object.keys(process.env)
    });
    throw new Error('FATAL ERROR: DATABASE_URL environment variable is not set in production.');
  }

  // חיבור TCP רגיל עבור פיתוח מקומי
  // Standard TCP connection for Local Development
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: console.log, // הצגת שאילתות בקונסול לצורך דיבאגינג
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// פונקציה לבדיקת החיבור
// Function to test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ החיבור למסד הנתונים (PostgreSQL) בוצע בהצלחה.');
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ שגיאה בהתחברות למסד הנתונים:', error);
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1); // עצירת השרת במקרה של כשל קריטי
  }
};

module.exports = { sequelize, connectDB };
