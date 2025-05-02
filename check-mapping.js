/**
 * Script to check the status of the Google Drive mapping file
 */

const fs = require('fs');
const path = require('path');

// Path to Google Drive mapping file
const MAPPING_PATH = path.join(__dirname, 'google-drive-mapping.json');

// Check if the mapping file exists
if (!fs.existsSync(MAPPING_PATH)) {
  console.error('Error: google-drive-mapping.json file not found.');
  console.log('The upload process may not have completed yet or no mappings have been created.');
  process.exit(1);
}

// Load the mapping file
try {
  const content = fs.readFileSync(MAPPING_PATH, 'utf8');
  const mapping = JSON.parse(content);
  
  // Remove README entry if it exists
  const readme = mapping.README;
  delete mapping.README;
  
  // Count the number of mappings
  const mappingCount = Object.keys(mapping).length;
  
  console.log(`Google Drive Mapping Status:`);
  console.log(`=========================`);
  console.log(`Total mappings: ${mappingCount}`);
  
  if (mappingCount > 0) {
    // Show a sample of the mappings
    console.log(`\nSample mappings:`);
    const sampleKeys = Object.keys(mapping).slice(0, 5);
    sampleKeys.forEach(key => {
      console.log(`${key} -> ${mapping[key]}`);
    });
    
    // Show the Google Drive URL for the first image
    const firstKey = sampleKeys[0];
    const firstId = mapping[firstKey];
    console.log(`\nExample Google Drive URL:`);
    console.log(`https://drive.google.com/uc?export=view&id=${firstId}`);
    
    // Provide next steps
    console.log(`\nNext Steps:`);
    console.log(`1. Run 'npm run generate-data' to generate API files with Google Drive URLs`);
    console.log(`2. Run 'npm start' to start the application and test the Google Drive integration`);
  } else {
    console.log(`\nNo mappings found in the file. The upload process may still be in progress.`);
  }
  
  // Restore README if it existed
  if (readme) {
    console.log(`\nREADME: ${readme}`);
  }
} catch (err) {
  console.error('Error reading mapping file:', err);
  process.exit(1);
}
