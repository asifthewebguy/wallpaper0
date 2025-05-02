document.addEventListener('DOMContentLoaded', () => {
    // Load configuration if available
    const appConfig = window.appConfig || {
        useGoogleDrive: true,
        fallbackToLocal: true,
        preloadAdjacentImages: true,
        cacheImages: true,
        showImageSource: true,
        transitionDuration: 1000,
        maxRetryAttempts: 3,
        retryDelay: 1000
    };

    // DOM elements
    const backgroundContainer = document.getElementById('background-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const randomBtn = document.getElementById('random-btn');
    const imageIdSpan = document.getElementById('image-id');

    // Add source indicator if configured
    let imageSourceSpan;
    if (appConfig.showImageSource) {
        imageSourceSpan = document.createElement('span');
        imageSourceSpan.id = 'image-source';
        imageSourceSpan.className = 'source-indicator';
        document.querySelector('.info-panel').appendChild(imageSourceSpan);
    }

    // State variables
    let images = [];
    let currentIndex = 0;
    let imageCache = {}; // Cache for image data
    let loadingImage = false; // Flag to prevent multiple simultaneous loads
    let retryCount = {}; // Track retry attempts for each image

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

    // Set background image with fallback mechanism
    async function setBackgroundImage(imageId) {
        // Prevent multiple simultaneous image loads
        if (loadingImage) return;
        loadingImage = true;

        // Reset retry count for this image
        retryCount[imageId] = 0;

        // Show loading state
        backgroundContainer.classList.add('loading');

        const imageData = await fetchImageData(imageId);
        if (!imageData) {
            backgroundContainer.classList.remove('loading');
            backgroundContainer.classList.add('error');
            imageIdSpan.textContent = `Error: Could not load image data for ${imageId}`;
            loadingImage = false;
            return;
        }

        // Function to try loading the image
        function tryLoadImage(src, isRetry = false, isFallback = false) {
            return new Promise((resolve, reject) => {
                const img = new Image();

                // For Google Drive images, we need to handle CORS differently
                if (src.includes('drive.google.com')) {
                    // Use our custom Google Drive proxy
                    console.log(`Using GoogleDriveProxy for image: ${src}`);

                    // Try to load the image with our proxy
                    GoogleDriveProxy.loadImage(src)
                        .then(usableUrl => {
                            // Successfully got a usable URL
                            backgroundContainer.style.backgroundImage = `url(${usableUrl})`;
                            backgroundContainer.classList.remove('loading', 'error');
                            imageIdSpan.textContent = imageData.id;

                            // Show image source
                            if (appConfig.showImageSource && imageSourceSpan) {
                                imageSourceSpan.textContent = `Source: Google Drive`;
                                imageSourceSpan.className = `source-indicator google-drive`;
                            }

                            resolve(true);
                        })
                        .catch(error => {
                            console.error(`All Google Drive loading methods failed: ${error.message}`);
                            reject(error);
                        });
                } else {
                    // Regular image loading for non-Google Drive images
                    img.onload = () => {
                        // Successfully loaded the image
                        backgroundContainer.style.backgroundImage = `url(${src})`;
                        backgroundContainer.classList.remove('loading', 'error');
                        imageIdSpan.textContent = imageData.id;

                        // Show image source if configured
                        if (appConfig.showImageSource && imageSourceSpan) {
                            const sourceText = isFallback ?
                                `Source: Local (Fallback)` :
                                `Source: ${imageData.source === 'google-drive' ? 'Google Drive' : 'Local'}`;
                            imageSourceSpan.textContent = sourceText;
                            imageSourceSpan.className = `source-indicator ${isFallback ? 'fallback' : imageData.source}`;
                        }

                        resolve(true);
                    };

                    img.onerror = () => {
                        console.warn(`Failed to load image from ${src}${isRetry ? ' (retry attempt)' : ''}`);
                        reject(new Error(`Failed to load image from ${isRetry ? 'retry' : 'primary'} source`));
                    };

                    img.src = src;
                }
            });
        }

        // Try to load the image with fallback and retry logic
        try {
            // First try the primary source (Google Drive or local)
            await tryLoadImage(imageData.path);
        } catch (error) {
            // If primary source fails and we have a fallback option
            if (appConfig.fallbackToLocal && imageData.source === 'google-drive' && imageData.localPath) {
                try {
                    console.log(`Trying fallback to local for ${imageId}`);
                    await tryLoadImage(imageData.localPath, false, true);
                } catch (fallbackError) {
                    // Both primary and fallback failed
                    console.error(`Both primary and fallback sources failed for ${imageId}`);
                    backgroundContainer.classList.remove('loading');
                    backgroundContainer.classList.add('error');
                    imageIdSpan.textContent = `Error loading: ${imageData.id}`;
                }
            } else {
                // No fallback available or fallback also failed
                backgroundContainer.classList.remove('loading');
                backgroundContainer.classList.add('error');
                imageIdSpan.textContent = `Error loading: ${imageData.id}`;
            }
        } finally {
            loadingImage = false;
        }

        // Preload adjacent images if configured
        if (appConfig.preloadAdjacentImages && images.length > 1) {
            const nextIndex = (currentIndex + 1) % images.length;
            const prevIndex = (currentIndex - 1 + images.length) % images.length;

            // Preload next and previous images in the background
            fetchImageData(images[nextIndex]);
            fetchImageData(images[prevIndex]);
        }
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
