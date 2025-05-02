/**
 * Script to check if the Google Drive mapping file exists and has valid entries
 */

const fs = require('fs');
const path = require('path');

// Path to Google Drive mapping file
const driveMappingPath = path.join(__dirname, 'google-drive-mapping.json');

// Check if the mapping file exists
if (!fs.existsSync(driveMappingPath)) {
  console.error('Error: google-drive-mapping.json file not found.');
  process.exit(1);
}

// Load the mapping file
try {
  const content = fs.readFileSync(driveMappingPath, 'utf8');
  const mapping = JSON.parse(content);
  
  // Remove README and example entries
  const cleanMapping = { ...mapping };
  delete cleanMapping.README;
  delete cleanMapping["EXAMPLE.jpg"];
  delete cleanMapping["EXAMPLE2.png"];
  
  // Count the number of mappings
  const mappingCount = Object.keys(cleanMapping).length;
  
  console.log(`Google Drive Mapping Status:`);
  console.log(`=========================`);
  console.log(`Total mappings: ${mappingCount}`);
  
  if (mappingCount === 0) {
    console.log(`\nNo valid mappings found in the file.`);
    console.log(`The file only contains example entries.`);
    console.log(`\nCreating a temporary mapping file for GitHub Pages...`);
    
    // Create a temporary mapping file with placeholder entries
    const tempMapping = {
      "README": "This is a temporary mapping file for GitHub Pages. Replace with actual mappings when available.",
      "NOTE": "The wallpaper application will fall back to local images when Google Drive mappings are not available."
    };
    
    // Write the temporary mapping file
    fs.writeFileSync(
      driveMappingPath,
      JSON.stringify(tempMapping, null, 2)
    );
    
    console.log(`Created temporary mapping file.`);
  } else {
    console.log(`\nValid mappings found in the file.`);
    
    // Show a sample of the mappings
    console.log(`\nSample mappings:`);
    const sampleKeys = Object.keys(cleanMapping).slice(0, 5);
    sampleKeys.forEach(key => {
      console.log(`${key} -> ${cleanMapping[key]}`);
    });
  }
} catch (err) {
  console.error('Error reading mapping file:', err);
  process.exit(1);
}
