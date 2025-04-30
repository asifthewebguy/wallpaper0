const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create API directories if they don't exist
const apiDir = path.join(__dirname, 'api');
const apiImagesDir = path.join(apiDir, 'images');
const apiRandomDir = path.join(apiDir, 'random');

if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
}
if (!fs.existsSync(apiImagesDir)) {
    fs.mkdirSync(apiImagesDir, { recursive: true });
}
if (!fs.existsSync(apiRandomDir)) {
    fs.mkdirSync(apiRandomDir, { recursive: true });
}

// Read the wp directory
const wpDir = path.join(__dirname, 'wp');
const files = fs.readdirSync(wpDir);

// Filter image files and create image data
const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
});

const imageData = imageFiles.map(file => {
    return {
        id: path.basename(file),
        path: `wp/${file}`,
        type: path.extname(file).toLowerCase().substring(1)
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
    fs.writeFileSync(
        path.join(apiImagesDir, `${image.id}.html`),
        `<!DOCTYPE html>
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
</html>`
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

console.log(`Generated image data for ${imageData.length} images.`);
console.log(`Created API endpoints in the api directory.`);
