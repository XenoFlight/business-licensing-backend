const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../config/db');
const { Business } = require('../models');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to call Nominatim API using native Node.js https module
const geocodeAddress = async (address) => {
  const url = 'https://nominatim.openstreetmap.org/search';
  try {
    const response = await axios.get(url, {
      params: {
        format: 'json',
        q: address,
        limit: 1,
        "accept-language": "en" // Prioritize English results for consistency
      },
      headers: {
        'User-Agent': 'BusinessLicensingApp/1.0 (Your-App-Contact@example.com)' // Required by Nominatim
      }
    });
    return response.data;
  } catch (error) {
    // Axios provides better error details
    console.error(`\n[API Error] Status: ${error.response?.status}. Failed to geocode address: "${address}"`);
    // Return an empty array to allow the loop to continue gracefully
    return [];
  }
};

const backfillCoordinates = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('🔌 Connected to database.');

    // 2. Find businesses missing coordinates
    const businesses = await Business.findAll({
      where: {
        latitude: null
      }
    });

    console.log(`🔍 Found ${businesses.length} businesses missing coordinates.`);

    // 3. Iterate and Geocode
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      // Construct the best possible address string from available fields
      const addressToGeocode = business.address || business.businessArea || business.street;

      if (!addressToGeocode) {
        console.log(`[${i + 1}/${businesses.length}] ⚠️ Skipping "${business.businessName}" (No address info)`);
        continue;
      }

      try {
        process.stdout.write(`[${i + 1}/${businesses.length}] 🌍 Geocoding: "${business.businessName}" (${addressToGeocode})... `);
        
        const results = await geocodeAddress(addressToGeocode);

        if (results && results.length > 0) {
          const { lat, lon } = results[0];
          
          // Update DB
          business.latitude = parseFloat(lat);
          business.longitude = parseFloat(lon);
          await business.save();
          
          console.log(`✅ Saved: ${lat}, ${lon}`);
        } else {
          console.log(`❌ No results found.`);
        }

      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }

      // 4. Rate Limiting (Important for OSM/Nominatim free tier)
      await delay(1200); 
    }

    console.log('🎉 Backfill complete.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

backfillCoordinates();
