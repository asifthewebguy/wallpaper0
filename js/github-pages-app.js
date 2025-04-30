document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const backgroundContainer = document.getElementById('background-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const randomBtn = document.getElementById('random-btn');
    const imageIdSpan = document.getElementById('image-id');

    // State variables
    let images = [];
    let currentIndex = 0;
    let imageCache = {}; // Cache for image data

    // API endpoints
    const API = {
        getAllImages: 'api/images.json',
        getImageById: (id) => `api/images/${id}.json`,
        getRandomImage: 'api/random/index.json'
    };

    // Fetch all image IDs
    async function fetchImageIds() {
        try {
            const response = await fetch(API.getAllImages);
            if (!response.ok) {
                throw new Error('Failed to fetch image IDs');
            }
            const imageIds = await response.json();
            return imageIds;
        } catch (error) {
            console.error('Error fetching image IDs:', error);
            return [];
        }
    }

    // Fetch image data by ID
    async function fetchImageData(imageId) {
        // Check if image data is in cache
        if (imageCache[imageId]) {
            return imageCache[imageId];
        }

        try {
            const response = await fetch(API.getImageById(imageId));
            if (!response.ok) {
                throw new Error(`Failed to fetch image data for ID: ${imageId}`);
            }
            const imageData = await response.json();

            // Cache the image data
            imageCache[imageId] = imageData;

            return imageData;
        } catch (error) {
            console.error(`Error fetching image data for ID: ${imageId}`, error);
            return null;
        }
    }

    // Fetch a random image
    async function fetchRandomImage() {
        try {
            // For GitHub Pages, we'll just select a random image from our array
            if (images.length > 0) {
                const randomIndex = Math.floor(Math.random() * images.length);
                return images[randomIndex];
            }
            return null;
        } catch (error) {
            console.error('Error fetching random image:', error);
            return null;
        }
    }

    // Set background image
    async function setBackgroundImage(imageId) {
        const imageData = await fetchImageData(imageId);
        if (!imageData) return;

        // Create a new image to preload
        const img = new Image();
        img.onload = () => {
            // Once loaded, set as background
            backgroundContainer.style.backgroundImage = `url(${imageData.path})`;
            imageIdSpan.textContent = imageData.id;
        };
        img.src = imageData.path;
    }

    // Initialize the application
    async function initialize() {
        // Fetch all image IDs
        images = await fetchImageIds();

        if (images.length > 0) {
            // Start with a random image
            currentIndex = Math.floor(Math.random() * images.length);
            await setBackgroundImage(images[currentIndex]);
        }
    }

    // Event handlers
    prevBtn.addEventListener('click', async () => {
        if (images.length === 0) return;
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        await setBackgroundImage(images[currentIndex]);
    });

    nextBtn.addEventListener('click', async () => {
        if (images.length === 0) return;
        currentIndex = (currentIndex + 1) % images.length;
        await setBackgroundImage(images[currentIndex]);
    });

    randomBtn.addEventListener('click', async () => {
        if (images.length === 0) return;
        const randomImageId = await fetchRandomImage();
        if (randomImageId) {
            // Find the index of this image in our array
            const index = images.indexOf(randomImageId);
            if (index !== -1) {
                currentIndex = index;
            }
            await setBackgroundImage(randomImageId);
        }
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        } else if (e.key === 'r' || e.key === 'R') {
            randomBtn.click();
        }
    });

    // Initialize the application
    initialize();
});
