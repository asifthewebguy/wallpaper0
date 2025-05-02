/**
 * Image Loader Class
 * Handles lazy loading of images with priority queue
 */

class ImageLoader {
    /**
     * Create a new ImageLoader instance
     * @param {Object} config - Configuration options
     */
    constructor(config) {
        this.config = config || {};
        this.imageQueue = [];
        this.loadedImages = {};
        this.currentIndex = 0;
        this.loadingImage = false;
        this.imageCache = {};
        this.retryCount = {};
        this.loadCallbacks = {};

        // Bind methods
        this.loadImage = this.loadImage.bind(this);
        this.preloadAdjacentImages = this.preloadAdjacentImages.bind(this);
        this.prioritizeQueue = this.prioritizeQueue.bind(this);
        this.processQueue = this.processQueue.bind(this);
        this.clearOldImages = this.clearOldImages.bind(this);
    }

    /**
     * Set the current index
     * @param {number} index - The current index
     */
    setCurrentIndex(index) {
        this.currentIndex = index;
        this.prioritizeQueue();
    }

    /**
     * Add an image to the loading queue
     * @param {string} imageId - The image ID
     * @param {number} priority - Priority level (lower is higher priority)
     * @param {Function} callback - Callback function when image is loaded
     */
    queueImage(imageId, priority, callback) {
        // Check if image is already in queue
        const existingIndex = this.imageQueue.findIndex(item => item.imageId === imageId);

        if (existingIndex !== -1) {
            // Update priority if it's higher
            if (priority < this.imageQueue[existingIndex].priority) {
                this.imageQueue[existingIndex].priority = priority;
            }

            // Add callback if provided
            if (callback) {
                if (!this.loadCallbacks[imageId]) {
                    this.loadCallbacks[imageId] = [];
                }
                this.loadCallbacks[imageId].push(callback);
            }
        } else {
            // Add new image to queue
            this.imageQueue.push({
                imageId,
                priority,
                timestamp: Date.now()
            });

            // Add callback if provided
            if (callback) {
                if (!this.loadCallbacks[imageId]) {
                    this.loadCallbacks[imageId] = [];
                }
                this.loadCallbacks[imageId].push(callback);
            }
        }

        // Sort queue by priority
        this.prioritizeQueue();

        // Process queue
        if (!this.loadingImage) {
            this.processQueue();
        }
    }

    /**
     * Prioritize the queue based on current index
     */
    prioritizeQueue() {
        // Sort by priority first, then by timestamp (older first)
        this.imageQueue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.timestamp - b.timestamp;
        });
    }

    /**
     * Process the image loading queue
     */
    async processQueue() {
        if (this.imageQueue.length === 0 || this.loadingImage) {
            return;
        }

        this.loadingImage = true;

        // Get the highest priority image
        const { imageId } = this.imageQueue.shift();

        try {
            // Load the image
            const imageData = await this.loadImage(imageId);

            // Execute callbacks
            if (this.loadCallbacks[imageId]) {
                this.loadCallbacks[imageId].forEach(callback => callback(imageData));
                delete this.loadCallbacks[imageId];
            }

            // Clear old images if we have too many
            this.clearOldImages();
        } catch (error) {
            console.error(`Failed to load image ${imageId}:`, error);

            // Execute callbacks with error
            if (this.loadCallbacks[imageId]) {
                this.loadCallbacks[imageId].forEach(callback => callback(null, error));
                delete this.loadCallbacks[imageId];
            }
        } finally {
            this.loadingImage = false;

            // Process next image in queue
            if (this.imageQueue.length > 0) {
                setTimeout(() => this.processQueue(), 50);
            }
        }
    }

    /**
     * Load an image by ID
     * @param {string} imageId - The image ID
     * @returns {Promise<Object>} - The image data
     */
    async loadImage(imageId) {
        // Check if image is already loaded
        if (this.loadedImages[imageId]) {
            return this.loadedImages[imageId].data;
        }

        // Check if image data is in cache
        if (this.imageCache[imageId]) {
            // Mark as loaded
            this.loadedImages[imageId] = {
                data: this.imageCache[imageId],
                index: this.currentIndex,
                timestamp: Date.now()
            };
            return this.imageCache[imageId];
        }

        // Fetch image data from API
        try {
            const response = await fetch(`api/images/${imageId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch image data for ID: ${imageId}`);
            }
            const imageData = await response.json();

            // Cache the image data
            this.imageCache[imageId] = imageData;

            // Mark as loaded
            this.loadedImages[imageId] = {
                data: imageData,
                index: this.currentIndex,
                timestamp: Date.now()
            };

            return imageData;
        } catch (error) {
            console.error(`Error fetching image data for ID: ${imageId}`, error);
            throw error;
        }
    }

    /**
     * Preload adjacent images
     * @param {number} currentIndex - The current image index
     * @param {Array} images - Array of all image IDs
     */
    preloadAdjacentImages(currentIndex, images) {
        if (!this.config.lazyLoading || !this.config.lazyLoading.enabled) {
            return;
        }

        const threshold = this.config.lazyLoading.preloadThreshold || 2;

        // Preload next images
        for (let i = 1; i <= threshold; i++) {
            const nextIndex = (currentIndex + i) % images.length;
            const nextImageId = images[nextIndex];
            this.queueImage(nextImageId, i);
        }

        // Preload previous images
        for (let i = 1; i <= threshold; i++) {
            const prevIndex = (currentIndex - i + images.length) % images.length;
            const prevImageId = images[prevIndex];
            this.queueImage(prevImageId, i);
        }
    }

    /**
     * Preload the actual image content
     * @param {Object} imageData - The image data object
     * @returns {Promise<boolean>} - Whether the image was successfully preloaded
     */
    preloadImageContent(imageData) {
        return new Promise((resolve, reject) => {
            if (!imageData || !imageData.path) {
                reject(new Error('Invalid image data'));
                return;
            }

            // For Google Drive images, we need special handling
            if (imageData.path.includes('drive.google.com') && typeof GoogleDriveProxy !== 'undefined') {
                // Use the Google Drive proxy
                GoogleDriveProxy.loadImage(imageData.path)
                    .then(url => {
                        // Create an image element to preload
                        const img = new Image();
                        img.onload = () => resolve(true);
                        img.onerror = () => {
                            // Try fallback if available
                            if (imageData.localPath) {
                                const fallbackImg = new Image();
                                fallbackImg.onload = () => resolve(true);
                                fallbackImg.onerror = () => reject(new Error('Failed to load image content'));
                                fallbackImg.src = imageData.localPath;
                            } else {
                                reject(new Error('Failed to load image content'));
                            }
                        };
                        img.src = url;
                    })
                    .catch(error => {
                        // Try fallback if available
                        if (imageData.localPath) {
                            const fallbackImg = new Image();
                            fallbackImg.onload = () => resolve(true);
                            fallbackImg.onerror = () => reject(new Error('Failed to load image content'));
                            fallbackImg.src = imageData.localPath;
                        } else {
                            reject(error);
                        }
                    });
            } else {
                // Regular image loading
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => reject(new Error('Failed to load image content'));
                img.src = imageData.path;
            }
        });
    }

    /**
     * Clear old images from memory
     */
    clearOldImages() {
        if (!this.config.lazyLoading || !this.config.lazyLoading.enabled) {
            return;
        }

        const threshold = this.config.lazyLoading.unloadThreshold || 10;
        const maxImages = this.config.lazyLoading.queueSize || 5;

        // Get all loaded image IDs
        const loadedImageIds = Object.keys(this.loadedImages);

        // If we have more images than the max, remove the oldest ones
        if (loadedImageIds.length > maxImages) {
            // Sort by distance from current index
            const sortedIds = loadedImageIds.sort((a, b) => {
                const aIndex = this.loadedImages[a].index;
                const bIndex = this.loadedImages[b].index;

                const aDist = Math.min(
                    Math.abs(aIndex - this.currentIndex),
                    Math.abs(aIndex + loadedImageIds.length - this.currentIndex),
                    Math.abs(this.currentIndex + loadedImageIds.length - aIndex)
                );

                const bDist = Math.min(
                    Math.abs(bIndex - this.currentIndex),
                    Math.abs(bIndex + loadedImageIds.length - this.currentIndex),
                    Math.abs(this.currentIndex + loadedImageIds.length - bIndex)
                );

                return bDist - aDist;
            });

            // Remove images that are far away
            for (let i = 0; i < sortedIds.length; i++) {
                const id = sortedIds[i];
                const index = this.loadedImages[id].index;

                const dist = Math.min(
                    Math.abs(index - this.currentIndex),
                    Math.abs(index + loadedImageIds.length - this.currentIndex),
                    Math.abs(this.currentIndex + loadedImageIds.length - index)
                );

                if (dist > threshold) {
                    delete this.loadedImages[id];
                    console.log(`Unloaded image ${id} (distance: ${dist})`);
                }
            }
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageLoader;
} else {
    window.ImageLoader = ImageLoader;
}
