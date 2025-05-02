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

// Load Google Drive mapping if it exists
let driveMapping = {};
const driveMappingPath = path.join(__dirname, 'google-drive-mapping.json');
if (fs.existsSync(driveMappingPath)) {
    try {
        driveMapping = JSON.parse(fs.readFileSync(driveMappingPath, 'utf8'));
        // Remove README and example entries
        delete driveMapping.README;
        delete driveMapping["EXAMPLE.jpg"];
        delete driveMapping["EXAMPLE2.png"];
        delete driveMapping["NOTE"];

        const mappingCount = Object.keys(driveMapping).length;
        console.log(`Loaded ${mappingCount} Google Drive mappings`);

        // If there are no valid mappings, disable Google Drive integration
        if (mappingCount === 0) {
            console.log('No valid Google Drive mappings found, disabling Google Drive integration');
            config.useGoogleDrive = false;
        }
    } catch (error) {
        console.error('Error loading Google Drive mapping:', error);
        // Disable Google Drive integration on error
        config.useGoogleDrive = false;
    }
} else {
    console.log('No Google Drive mapping file found, disabling Google Drive integration');
    config.useGoogleDrive = false;
}

// Create directories if they don't exist
const dataDir = path.join(__dirname, 'data');
const apiDir = path.join(__dirname, 'api');
const apiImagesDir = path.join(apiDir, 'images');
const apiRandomDir = path.join(apiDir, 'random');

// Use recursive option to create parent directories if needed
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(apiImagesDir, { recursive: true });
fs.mkdirSync(apiRandomDir, { recursive: true });

// Read the wp directory
const wpDir = path.join(__dirname, 'wp');
const files = fs.readdirSync(wpDir);

// Filter image files and create image data
const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
});

const imageData = imageFiles.map(file => {
    const fileName = path.basename(file);
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

// Write the image data to a JSON file for the main app
fs.writeFileSync(
    path.join(dataDir, 'images.json'),
    JSON.stringify(imageData, null, 2)
);

// Create index.json in api directory with all image IDs
fs.writeFileSync(
    path.join(apiDir, 'images.json'),
    JSON.stringify(imageFiles.map(file => path.basename(file)), null, 2)
);

// Create individual JSON files for each image in api/images directory
imageData.forEach(image => {
    fs.writeFileSync(
        path.join(apiImagesDir, `${image.id}.json`),
        JSON.stringify(image, null, 2)
    );

    // Create HTML files that redirect to the actual images
    // For Google Drive images, we need a different approach since the URL is absolute
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

    fs.writeFileSync(
        path.join(apiImagesDir, `${image.id}.html`),
        redirectContent
    );
});

// Create random.json in api/random directory
fs.writeFileSync(
    path.join(apiRandomDir, 'index.json'),
    JSON.stringify({ message: "Use index.html to get a random image" }, null, 2)
);

// Create random.html that redirects to a random image
fs.writeFileSync(
    path.join(apiRandomDir, 'index.html'),
    `<!DOCTYPE html>
<html>
<head>
    <title>Random Image</title>
</head>
<body>
    <p>Redirecting to random image...</p>
    <script>
        fetch('../images.json')
            .then(response => response.json())
            .then(images => {
                const randomIndex = Math.floor(Math.random() * images.length);
                const randomImage = images[randomIndex];
                const result = { id: randomImage };

                // Display the result as JSON
                document.body.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';

                // You can uncomment the following line to redirect to the actual image
                // window.location.href = '../images/' + randomImage + '.html';
            })
            .catch(error => {
                document.body.innerHTML = '<p>Error: ' + error.message + '</p>';
            });
    </script>
</body>
</html>`
);

// Copy the Google Drive mapping file to the data directory if it exists
if (fs.existsSync(driveMappingPath)) {
    try {
        // Create a copy of the mapping file without README and example entries
        const cleanMapping = { ...driveMapping };

        // Add a note about the file
        cleanMapping.NOTE = "This file maps local image filenames to Google Drive file IDs.";

        fs.writeFileSync(
            path.join(dataDir, 'google-drive-mapping.json'),
            JSON.stringify(cleanMapping, null, 2)
        );
        console.log(`Copied Google Drive mapping file to data directory.`);
    } catch (error) {
        console.error('Error copying Google Drive mapping file:', error);
    }
}

console.log(`Generated image data for ${imageData.length} images.`);
console.log(`Created API endpoints in the api directory.`);
