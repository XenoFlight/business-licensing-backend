const fs = require('fs');
const path = require('path');

console.log('🚀 Script started...');

// Define paths
const tempDir = path.join(__dirname, '../temp');
const outputDir = path.join(__dirname, '../data');
const outputFile = path.join(outputDir, 'businesses.json');

console.log(`📂 Looking for temp files in: ${tempDir}`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)){
    console.log(`📂 Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
}

// Mapping Hebrew keys to English for better code readability
// Handles keys from both source files
const keyMap = {
    "מס' תיק": "fileNumber",
    "פריט עיסוק": "occupationItem",
    "מהות העסק": "businessDescription",
    "שם העסק": "businessName",
    "בעל העסק": "businessOwner",
    "גוש": "block",
    "חלקה": "plot",
    "סטטוס התיק": "status",
    "אזור העסק": "businessArea",
    "נייח בעסק": "phone",
    "נייד בעסק": "mobile",
    "שטח עסק כולל": "totalArea",
    "רחוב העסק": "street",
    "מספר בית": "houseNumber",
    "תאריך ניפוק": "issueDate",
    "תאריך פקיעה": "expirationDate",
    "מספר רשיון": "licenseNumber",
    "תאריך הגשה אחרון": "lastSubmissionDate",
    "תאריך פתיחה": "openingDate",
    "מזהה": "businessId",
    "תצהיר כבאות": "fireAffidavit",
    "שטח עסק מבונה": "builtArea",
    "מסלול מקוצר לבקשה": "shortTrackPath",
    "פריט מתאים למסלול מקוצר": "suitableForShortTrack",
    "סיבת הגשה": "submissionReason",
    "חברה": "isCompany",
    "מפקח התיק": "inspector",

    // --- Aliases from the second file ---
    "מספר תיק": "fileNumber",
    "תאריך פתיחת התיק": "openingDate",
    "סיבת הגשה אחרונה": "lastSubmissionReason",
    "תאריך ביקורת אחרונה": "lastInspectionDate",
    "סטטוס תכנון ובנייה": "planningStatus",
    "סטטוס איכות הסביבה": "environmentStatus",
    "סטטוס בריאות": "healthStatus",
    "סטטוס משטרה": "policeStatus",
    "סטטוס כבאות": "fireDeptStatus",
    "סטטוס חקלאות": "agricultureStatus",
    "סטטוס כלכלה": "economyStatus",
    "סטטוס נגישות": "accessibilityStatus"
};

const processFiles = () => {
    try {
        if (!fs.existsSync(tempDir)) {
            console.error(`❌ Temp directory not found at: ${tempDir}`);
            return;
        }

        // 1. Find all JSON files in the temp directory
        const files = fs.readdirSync(tempDir).filter(file => file.toLowerCase().endsWith('.json'));
        
        if (files.length === 0) {
            console.log('❌ No JSON files found in temp directory.');
            return;
        }

        console.log(`Found ${files.length} files in temp folder. Processing...`);

        let allBusinesses = [];

        // 2. Read and combine data from all files
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            console.log(`   Reading: ${file}`);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(rawData);

            if (Array.isArray(jsonData)) {
                allBusinesses = allBusinesses.concat(jsonData);
            }
        });

        // 3. Map keys to English
        const mappedBusinesses = allBusinesses.map(item => {
            const newItem = {};
            for (const key in item) {
                const newKey = keyMap[key] || key; // Use mapped key or original if not found
                newItem[newKey] = item[key];
            }
            return newItem;
        });

        // 4. Write the new DB file
        fs.writeFileSync(outputFile, JSON.stringify(mappedBusinesses, null, 2), 'utf8');
        console.log(`✅ Successfully created database at: ${outputFile}`);
        console.log(`✅ Total records: ${mappedBusinesses.length}`);
        console.log('🚀 You can now safely remove the "temp" folder.');

    } catch (error) {
        console.error('❌ Error processing files:', error);
    }
};

processFiles();