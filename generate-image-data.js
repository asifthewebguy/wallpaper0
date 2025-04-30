const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Read the wp directory
const wpDir = path.join(__dirname, 'wp');
const files = fs.readdirSync(wpDir);

// Filter image files and create image data
const imageData = files
    .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    })
    .map(file => {
        return {
            id: path.basename(file),
            path: `wp/${file}`,
            type: path.extname(file).toLowerCase().substring(1)
        };
    });

// Write the image data to a JSON file
fs.writeFileSync(
    path.join(dataDir, 'images.json'),
    JSON.stringify(imageData, null, 2)
);

console.log(`Generated image data for ${imageData.length} images.`);
