const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware to prevent access to sensitive files
app.use((req, res, next) => {
    const blockedFiles = [
        '/credentials.json',
        '/token.json',
        '/google-drive-mapping.json',
        '/upload-to-drive.js',
        '/test-credentials.js',
        '/test-drive-integration.js'
    ];

    // Check if the request is for a blocked file
    if (blockedFiles.some(file => req.path.endsWith(file))) {
        return res.status(403).json({ error: 'Access denied' });
    }

    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint to get all image IDs
app.get('/api/images', (req, res) => {
    try {
        const wpDir = path.join(__dirname, 'wp');
        const files = fs.readdirSync(wpDir);

        // Filter out non-image files and get just the filenames without extensions
        const imageIds = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            })
            .map(file => path.basename(file));

        res.json(imageIds);
    } catch (error) {
        console.error('Error reading image directory:', error);
        res.status(500).json({ error: 'Failed to read image directory' });
    }
});

// API endpoint to get an image by ID
app.get('/api/images/:id', (req, res) => {
    try {
        const imageId = req.params.id;
        const wpDir = path.join(__dirname, 'wp');
        const files = fs.readdirSync(wpDir);

        // Find the file that matches the ID
        const imageFile = files.find(file => path.basename(file) === imageId);

        if (!imageFile) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const imagePath = path.join(wpDir, imageFile);
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// API endpoint to get a random image
app.get('/api/random', (req, res) => {
    try {
        const wpDir = path.join(__dirname, 'wp');
        const files = fs.readdirSync(wpDir);

        // Filter out non-image files
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });

        if (imageFiles.length === 0) {
            return res.status(404).json({ error: 'No images found' });
        }

        // Select a random image
        const randomIndex = Math.floor(Math.random() * imageFiles.length);
        const randomImage = imageFiles[randomIndex];
        const randomImageId = path.basename(randomImage);

        res.json({ id: randomImageId });
    } catch (error) {
        console.error('Error serving random image:', error);
        res.status(500).json({ error: 'Failed to serve random image' });
    }
});

// API endpoint to get all images data
app.get('/api/images-data', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'images.json');

        // Check if the data file exists
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ error: 'Images data file not found' });
        }

        // Read the images data file
        const imagesData = fs.readFileSync(dataPath, 'utf8');

        // Parse and send the JSON data
        res.json(JSON.parse(imagesData));
    } catch (error) {
        console.error('Error serving images data:', error);
        res.status(500).json({ error: 'Failed to serve images data' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
