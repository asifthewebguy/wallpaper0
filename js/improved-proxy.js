/**
 * Improved Google Drive Image Proxy for GitHub Pages
 * 
 * This script provides a more reliable way to load Google Drive images on GitHub Pages
 * by using multiple fallback methods and better error handling.
 */
window.GoogleDriveProxy = {
    /**
     * Extract the file ID from a Google Drive URL
     * @param {string} url - The Google Drive URL
     * @returns {string|null} - The file ID or null if not found
     */
    extractFileId: function(url) {
        // Handle the export=view format
        if (url.includes('export=view&id=')) {
            const idParam = url.split('id=')[1];
            return idParam ? idParam.split('&')[0] : null;
        }

        // Handle the /file/d/ format
        const fileMatch = url.match(/\/file\/d\/([^/]+)/);
        if (fileMatch && fileMatch[1]) {
            return fileMatch[1];
        }

        // Handle the id= format
        const idMatch = url.match(/[?&]id=([^&]+)/);
        if (idMatch && idMatch[1]) {
            return idMatch[1];
        }

        return null;
    },

    /**
     * Load an image from Google Drive with multiple fallback methods
     * @param {string} driveUrl - The Google Drive URL
     * @returns {Promise<string>} - A promise that resolves to a usable image URL
     */
    loadImage: function(driveUrl) {
        return new Promise((resolve, reject) => {
            const fileId = this.extractFileId(driveUrl);

            if (!fileId) {
                console.error('Could not extract file ID from URL:', driveUrl);
                reject(new Error('Invalid Google Drive URL'));
                return;
            }

            // Try multiple methods to load the image
            this.tryLoadingMethods(fileId)
                .then(url => resolve(url))
                .catch(error => reject(error));
        });
    },

    /**
     * Try multiple methods to load a Google Drive image
     * @param {string} fileId - The Google Drive file ID
     * @returns {Promise<string>} - A promise that resolves to a usable image URL
     */
    tryLoadingMethods: function(fileId) {
        return new Promise((resolve, reject) => {
            // Method 1: Use the thumbnail API (most reliable for CORS)
            const thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';
            
            // Method 2: Use the uc export API
            const exportUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
            
            // Method 3: Use the direct file API
            const directUrl = 'https://drive.google.com/file/d/' + fileId + '/view';

            // Try the thumbnail API first (most reliable for CORS)
            console.log('Trying Google Drive thumbnail API:', thumbnailUrl);
            
            // Create a test image to check if the thumbnail loads
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous'; // Try with CORS enabled
            
            testImg.onload = () => {
                console.log('Successfully loaded image using thumbnail API');
                resolve(thumbnailUrl);
            };
            
            testImg.onerror = () => {
                console.warn('Thumbnail API failed, trying export API');
                
                // Try the export API as fallback
                const exportImg = new Image();
                exportImg.crossOrigin = 'anonymous';
                
                exportImg.onload = () => {
                    console.log('Successfully loaded image using export API');
                    resolve(exportUrl);
                };
                
                exportImg.onerror = () => {
                    console.warn('Export API failed, using thumbnail API anyway');
                    // Even if the test failed, the thumbnail API is still our best bet
                    // Some browsers will block the test but allow the actual usage
                    resolve(thumbnailUrl);
                };
                
                exportImg.src = exportUrl;
            };
            
            testImg.src = thumbnailUrl;
        });
    }
};
