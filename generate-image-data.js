const fs = require('fs');
const path = require('path');
const ImageOptimizer = require('./image-optimizer');

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

// Run image optimization if enabled
let optimizedImages = [];
if (config.imageOptimization && config.imageOptimization.enabled !== false) {
    console.log('Running image optimization...');
    const optimizer = new ImageOptimizer(config.imageOptimization);

    // Run optimization synchronously to ensure it's complete before proceeding
    try {
        // Since optimizeAll returns a Promise, we need to use await
        // But since we're not in an async function, we need to use a different approach
        // We'll run the optimization and then continue with the script
        optimizer.optimizeAll()
            .then(results => {
                optimizedImages = results;
                console.log(`Optimization complete. Generated ${results.length} optimized images.`);

                // Continue with the rest of the script
                continueWithImageGeneration();
            })
            .catch(error => {
                console.error('Error during image optimization:', error);

                // Continue with the script even if optimization fails
                continueWithImageGeneration();
            });

        // Return early since we'll continue in the callback
        return;
    } catch (error) {
        console.error('Error setting up image optimization:', error);
    }
}

// If we didn't run optimization or it failed to set up, continue with the script
continueWithImageGeneration();

// Function to continue with image generation after optimization
function continueWithImageGeneration() {

// Determine which directory to use for images
const useOptimizedImages = config.imageOptimization &&
                          config.imageOptimization.enabled !== false &&
                          config.imageOptimization.useOptimizedImages !== false;

const wpDir = path.join(__dirname, useOptimizedImages ?
                        (config.imageOptimization.outputDir || 'wp-optimized') :
                        'wp');

console.log(`Using image directory: ${wpDir}`);

// Read the image directory
let files = [];
try {
    files = fs.readdirSync(wpDir);
} catch (error) {
    console.error(`Error reading directory ${wpDir}:`, error);
    // Fallback to original wp directory if optimized directory doesn't exist
    const fallbackDir = path.join(__dirname, 'wp');
    console.log(`Falling back to original directory: ${fallbackDir}`);
    files = fs.readdirSync(fallbackDir);
}

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
    let imagePath, imageSource, driveFileId;

    if (config.useGoogleDrive && driveId) {
        // Use Google Drive URL
        driveFileId = driveId;
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
        driveFileId: driveFileId || null, // Include the Google Drive file ID if available
        localPath: `${config.localImagePath}${file}`, // Always include local path for fallback
        thumbnailUrl: driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w2000` : null // Add thumbnail URL for Google Drive images
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
    <title>Image: ${image.id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 20px;
        }
        .loading {
            margin: 20px 0;
        }
        .error {
            color: red;
            display: none;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <h1>Image: ${image.id}</h1>
    <div class="loading">Loading image from Google Drive...</div>
    <div class="error">Failed to load from Google Drive, trying local fallback...</div>

    <script>
        // Function to try loading the image with multiple methods
        async function loadImage() {
            const methods = [
                // Method 1: Try thumbnail API (most reliable for CORS)
                "${image.thumbnailUrl || `https://drive.google.com/thumbnail?id=${image.driveFileId}&sz=w2000`}",
                // Method 2: Try export API
                "${image.path}",
                // Method 3: Fallback to local
                "../../${image.localPath}"
            ];

            let img = document.createElement('img');
            let loaded = false;

            // Try each method in sequence
            for (let i = 0; i < methods.length; i++) {
                const url = methods[i];
                try {
                    // Show appropriate message
                    if (i === 2) {
                        document.querySelector('.loading').style.display = 'none';
                        document.querySelector('.error').style.display = 'block';
                    }

                    // Try to load the image
                    await new Promise((resolve, reject) => {
                        img = new Image();
                        img.onload = () => {
                            loaded = true;
                            resolve();
                        };
                        img.onerror = () => reject(new Error('Failed to load image'));
                        img.src = url;

                        // Set a timeout to avoid hanging forever
                        setTimeout(() => reject(new Error('Timeout')), 5000);
                    });

                    // If we get here, the image loaded successfully
                    break;
                } catch (error) {
                    console.warn(\`Method \${i+1} failed: \${error.message}\`);
                    // Continue to next method
                }
            }

            // If any method succeeded, display the image
            if (loaded) {
                document.querySelector('.loading').style.display = 'none';
                document.querySelector('.error').style.display = 'none';
                document.body.appendChild(img);
            } else {
                document.querySelector('.loading').style.display = 'none';
                document.querySelector('.error').textContent = 'All loading methods failed. Please try again later.';
                document.querySelector('.error').style.display = 'block';
            }
        }

        // Start loading the image
        loadImage();
    </script>
</body>
</html>`
        : `<!DOCTYPE html>
<html>
<head>
    <title>Image: ${image.id}</title>
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
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 20px;
        }
        pre {
            text-align: left;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin: 20px auto;
            max-width: 400px;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>Random Image</h1>
    <p>Loading random image...</p>
    <div id="result"></div>
    <div id="buttons" style="display: none;">
        <a href="#" id="viewButton" class="button">View Image</a>
        <a href="#" id="anotherButton" class="button">Get Another Random Image</a>
    </div>

    <script>
        function getRandomImage() {
            document.getElementById('result').innerHTML = '';
            document.getElementById('buttons').style.display = 'none';

            fetch('../images.json')
                .then(response => response.json())
                .then(images => {
                    const randomIndex = Math.floor(Math.random() * images.length);
                    const randomImage = images[randomIndex];
                    const result = { id: randomImage };

                    // Display the result as JSON
                    document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';

                    // Set up the view button
                    const viewButton = document.getElementById('viewButton');
                    viewButton.href = '../images/' + randomImage + '.html';

                    // Set up the another button
                    const anotherButton = document.getElementById('anotherButton');
                    anotherButton.onclick = function(e) {
                        e.preventDefault();
                        getRandomImage();
                    };

                    // Show the buttons
                    document.getElementById('buttons').style.display = 'block';
                })
                .catch(error => {
                    document.getElementById('result').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                });
        }

        // Initial load
        getRandomImage();
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
} // End of continueWithImageGeneration function
