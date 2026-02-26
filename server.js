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
    // Normalize legacy/Hebrew status values and safely cast to enum before Sequelize ALTER.
    try {
      // ensure enum type exists (do nothing if already created)
      await sequelize.query(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_businesses_status') THEN
    CREATE TYPE "public"."enum_businesses_status" AS ENUM(
      'application_submitted',
      'pending_review',
      'renewal_in_progress',
      'approved',
      'temporarily_permitted',
      'rejected',
      'closed',
      'in_process',
      'active',
      'expired',
      'revoked'
    );
  END IF;
END
$$;
      `);

      await sequelize.query(`ALTER TYPE "public"."enum_businesses_status" ADD VALUE IF NOT EXISTS 'pending_review';`);
      await sequelize.query(`ALTER TYPE "public"."enum_businesses_status" ADD VALUE IF NOT EXISTS 'renewal_in_progress';`);
      await sequelize.query(`ALTER TYPE "public"."enum_businesses_status" ADD VALUE IF NOT EXISTS 'approved';`);
      await sequelize.query(`ALTER TYPE "public"."enum_businesses_status" ADD VALUE IF NOT EXISTS 'temporarily_permitted';`);
      await sequelize.query(`ALTER TYPE "public"."enum_businesses_status" ADD VALUE IF NOT EXISTS 'rejected';`);

      // attempt safe migration of the column if necessary
      await sequelize.query(`ALTER TABLE "businesses" ALTER COLUMN status DROP DEFAULT;`);

      await sequelize.query(`
        ALTER TABLE "businesses"
        ALTER COLUMN status TYPE "public"."enum_businesses_status"
        USING (
          CASE
            WHEN status IS NULL OR btrim(status::text) = '' THEN 'application_submitted'
            WHEN status::text IN ('application_submitted','pending_review','renewal_in_progress','approved','temporarily_permitted','rejected','closed','in_process','active','expired','revoked') THEN
              CASE
                WHEN status::text = 'in_process' THEN 'pending_review'
                WHEN status::text = 'active' THEN 'approved'
                WHEN status::text = 'expired' THEN 'renewal_in_progress'
                WHEN status::text = 'revoked' THEN 'rejected'
                ELSE status::text
              END
            WHEN status::text IN ('פעיל','רישיון','רישיון בתוקף','לצמיתות','רישוין תקופתי') THEN 'approved'
            WHEN status::text IN ('רישיון זמני','היתר זמני') THEN 'temporarily_permitted'
            WHEN status::text IN ('בטיפול','בהמתנה','לידיעה','תיק פיקוח') THEN 'pending_review'
            WHEN status::text IN ('בתהליך חידוש','חידוש') THEN 'renewal_in_progress'
            WHEN status::text IN ('נדחה') THEN 'rejected'
            WHEN status::text IN ('סגור') THEN 'closed'
            WHEN status::text IN ('לא הוגשה בקשה','בקשה מקוונת') THEN 'application_submitted'
            ELSE 'application_submitted'
          END::"public"."enum_businesses_status"
        );
      `);

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