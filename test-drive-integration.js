/**
 * Test script for Google Drive integration
 * This script tests the Google Drive integration without requiring the actual credentials.json file
 */

const fs = require('fs');
const path = require('path');

// Load configuration
let config;
try {
    config = require('./config');
    console.log('Loaded configuration from config.js');
} catch (error) {
    console.warn('Could not load config.js, using default settings');
    config = {
        useGoogleDrive: true,
        fallbackToLocal: true,
        googleDriveBaseUrl: 'https://drive.google.com/uc?export=view&id=',
        localImagePath: 'wp/'
    };
}

// Create a test mapping file
const testMapping = {
    "README": "This is a test mapping file for Google Drive integration",
    // Replace these with actual Google Drive file IDs when you have them
    "0HF1UCUTVN.png": "EXAMPLE_GOOGLE_DRIVE_FILE_ID_1",
    "1ANORQNKM0.png": "EXAMPLE_GOOGLE_DRIVE_FILE_ID_2",
    "1X25QVAT6Q.png": "EXAMPLE_GOOGLE_DRIVE_FILE_ID_3"
};

// Save the test mapping file
fs.writeFileSync('test-drive-mapping.json', JSON.stringify(testMapping, null, 2));
console.log('Created test-drive-mapping.json file');

// Load the test mapping
let driveMapping = {};
try {
    driveMapping = JSON.parse(fs.readFileSync('test-drive-mapping.json', 'utf8'));
    // Remove README entry
    delete driveMapping.README;
    
    const mappingCount = Object.keys(driveMapping).length;
    console.log(`Loaded ${mappingCount} Google Drive mappings`);
} catch (error) {
    console.error('Error loading Google Drive mapping:', error);
}

// Get list of image files
const wpDir = path.join(__dirname, 'wp');
const imageFiles = fs.readdirSync(wpDir)
    .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    })
    .slice(0, 10); // Just get the first 10 images for testing

console.log(`Found ${imageFiles.length} image files for testing`);

// Create image data with Google Drive URLs when available
const imageData = imageFiles.map(file => {
    const fileName = file;
    const driveId = driveMapping[fileName];
    const fileType = path.extname(file).toLowerCase().substring(1);
    
    // Determine the image path based on Google Drive availability
    let imagePath, imageSource;
    
    if (config.useGoogleDrive && driveId) {
        // Use Google Drive URL
        imagePath = `${config.googleDriveBaseUrl}${driveId}`;
        imageSource = 'google-drive';
    } else {
        // Use local path
        imagePath = `${config.localImagePath}${file}`;
        imageSource = 'local';
    }
    
    return {
        id: fileName,
        path: imagePath,
        type: fileType,
        source: imageSource,
        localPath: `${config.localImagePath}${file}` // Always include local path for fallback
    };
});

// Display the results
console.log('\nImage Data:');
imageData.forEach((image, index) => {
    console.log(`\nImage ${index + 1}:`);
    console.log(`  ID: ${image.id}`);
    console.log(`  Path: ${image.path}`);
    console.log(`  Type: ${image.type}`);
    console.log(`  Source: ${image.source}`);
    console.log(`  Local Path: ${image.localPath}`);
});

// Test HTML redirect generation
console.log('\nGenerating test HTML redirects:');
imageData.forEach((image, index) => {
    const redirectContent = image.source === 'google-drive'
        ? `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url=${image.path}">
</head>
<body>
    <p>Redirecting to image on Google Drive...</p>
    <script>
        // Try Google Drive first
        window.location.href = "${image.path}";
        
        // If Google Drive fails, fallback to local (handled by JS in the actual app)
        window.addEventListener('error', function(e) {
            if (e.target.tagName.toLowerCase() === 'img') {
                console.warn('Google Drive image failed to load, falling back to local');
                window.location.href = "../../${image.localPath}";
            }
        }, true);
    </script>
</body>
</html>`
        : `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url=../../${image.path}">
</head>
<body>
    <p>Redirecting to image...</p>
    <script>
        window.location.href = "../../${image.path}";
    </script>
</body>
</html>`;
    
    console.log(`  Generated HTML redirect for ${image.id} (${image.source})`);
});

console.log('\nTest completed successfully!');
console.log('Next steps:');
console.log('1. Create a Google Cloud project and enable the Google Drive API');
console.log('2. Download the credentials.json file and place it in the project root');
console.log('3. Run the upload-to-drive.js script to upload images and generate the mapping file');
console.log('4. Run the generate-image-data.js script to generate the API files with Google Drive URLs');
