require('dotenv').config();
const app = require('./app');
const { connectDB, sequelize } = require('./config/db');
require('./models'); // טעינת המודלים והקשרים (Load models and associations)

const PORT = process.env.PORT || 8080;

// Endpoint to serve the API key to the frontend
app.get('/api/config/google-maps', (req, res) => {
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// פונקציה להפעלת השרת
// Function to start the server
const startServer = async () => {
  try {
    // Check for critical environment variables
    if (!process.env.JWT_SECRET) {
      console.error('❌ FATAL ERROR: JWT_SECRET is not defined in .env file.');
      process.exit(1);
    }

    // 1. התחברות למסד הנתונים
    // Connect to Database
    await connectDB();

    // 2. סנכרון המודלים מול מסד הנתונים (יצירת טבלאות אם לא קיימות)
    // Before we let Sequelize perform its automatic ALTERs, ensure the "status" column
    // can safely be converted to an ENUM without tripping the default-cast bug.
    // The error we saw (`default for column "status" cannot be cast automatically…`)
    // happens when Postgres tries to convert an existing default value while changing
    // the column type. We drop the default, convert the type, and then re-add it.
    try {
      // ensure enum type exists (do nothing if already created)
      await sequelize.query(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_businesses_status') THEN
    CREATE TYPE "public"."enum_businesses_status" AS ENUM('application_submitted','in_process','active','expired','revoked','closed');
  END IF;
END
$$;
      `);

      // attempt safe migration of the column if necessary
      await sequelize.query(`ALTER TABLE "businesses" ALTER COLUMN status DROP DEFAULT;`);
      await sequelize.query(`ALTER TABLE "businesses" ALTER COLUMN status TYPE "public"."enum_businesses_status" USING (status::text::"public"."enum_businesses_status");`);
      await sequelize.query(`ALTER TABLE "businesses" ALTER COLUMN status SET DEFAULT 'application_submitted';`);
    } catch (enumErr) {
      // ignore errors; sync below will still try its own changes if needed
      console.warn('⚠️ Pre-sync enum adjustment failed or not needed:', enumErr.message || enumErr);
    }

    // FIX: Handle duplicate empty strings in licenseNumber before creating unique index.
    try {
      await sequelize.query(`UPDATE "businesses" SET "licenseNumber" = NULL WHERE "licenseNumber" = '';`);
      console.log('✅ Cleaned up "licenseNumber" column for unique constraint.');
    } catch (cleanupErr) {
      console.warn('⚠️ Could not clean up "licenseNumber" column:', cleanupErr.message);
    }

    // Sync models with DB (create tables if not exist)
    // alter: true מעדכן את הטבלות לפי המודלים מבלי למחוק מידע קיים
    await sequelize.sync({ alter: true });
    console.log('✅ הטבלאות סונכרנו מול מסד הנתונים.');
    console.log('✅ Database tables synced successfully.');

    // 3. האזנה לבקשות
    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 השרת רץ על פורט ${PORT}`);
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // טיפול בסגירה מסודרת של השרת
    // Graceful shutdown handling
    const gracefulShutdown = async () => {
      console.log('🛑 Received kill signal, shutting down gracefully...');
      
      server.close(async () => {
        console.log('🛑 HTTP server closed.');
        try {
          await sequelize.close();
          console.log('🛑 Database connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error closing database connection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ שגיאה בהפעלת השרת:', error);
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// טיפול בשגיאות לא צפויות ברמת התהליך
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Optional: process.exit(1) if you want to restart on unhandled errors
});

startServer();