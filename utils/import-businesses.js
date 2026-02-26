const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, sequelize } = require('../config/db');

// Load models so sequelize.models.Business is available
require('../models'); 

const importBusinesses = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('🔌 Connected to database for seeding.');

    // Force sync to drop the old table and create a new one with the correct schema
    await sequelize.sync({ force: true });
    console.log('✅ Database tables recreated (force sync).');

    // 2. Read the JSON file
    const dataPath = path.join(__dirname, '../data/businesses.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Data file not found:', dataPath);
      process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const businesses = JSON.parse(rawData);

    if (!businesses.length) {
      console.log('⚠️ No businesses found in JSON file to import.');
      process.exit(0);
    }

    console.log(`📄 Found ${businesses.length} records. Preparing to insert...`);

    // 3. Transform data (Parse Dates & Booleans)
    const processedRecords = businesses.map(b => ({
      ...b,
      // Convert "M/D/YY" strings to Date objects
      openingDate: parseDate(b.openingDate),
      lastSubmissionDate: parseDate(b.lastSubmissionDate),
      lastInspectionDate: parseDate(b.lastInspectionDate),
      issueDate: parseDate(b.issueDate),
      expirationDate: parseDate(b.expirationDate),
      // Parse Booleans (handle "0", "1", "")
      isCompany: parseBoolean(b.isCompany),
      suitableForShortTrack: parseBoolean(b.suitableForShortTrack),
      fireAffidavit: parseBoolean(b.fireAffidavit),
      // Add timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // 3.1 Deduplicate Records
    // The JSON contains duplicate fileNumbers (history). We keep the most relevant one.
    const uniqueRecordsMap = new Map();

    processedRecords.forEach(record => {
      const key = record.fileNumber;
      if (!key) return; // Skip records without a file number

      if (uniqueRecordsMap.has(key)) {
        const existing = uniqueRecordsMap.get(key);
        // If the existing record is 'Closed' (סגור) and the new one is NOT,
        // we assume the new one is the active version and replace the old one.
        if (existing.status === 'סגור' && record.status !== 'סגור') {
          uniqueRecordsMap.set(key, record);
        }
      } else {
        uniqueRecordsMap.set(key, record);
      }
    });

    const records = Array.from(uniqueRecordsMap.values());
    console.log(`✨ Deduplicated: Reduced from ${processedRecords.length} to ${records.length} unique records.`);

    // 4. Insert into Database
    // We use the model 'Business' to ensure validation rules are respected
    const Business = sequelize.models.Business;
    
    if (!Business) {
      throw new Error('Business model not found. Please ensure models are defined correctly.');
    }

    // bulkCreate is more efficient than creating one by one
    await Business.bulkCreate(records);

    console.log(`✅ Successfully imported ${records.length} businesses!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

// Helper function to parse "M/D/YY" date format
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  
  if (year < 100) year += 2000; // Handle 2-digit years
  
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to parse boolean values
function parseBoolean(val) {
  if (val === '1' || val === 1 || val === true || val === 'true') return true;
  if (val === '0' || val === 0 || val === false || val === 'false') return false;
  return null; // Treat empty string or other values as null
}

importBusinesses();