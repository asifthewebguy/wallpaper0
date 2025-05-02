/**
 * Simple Google Drive Image Proxy for GitHub Pages
 *
 * This script provides a workaround for CORS issues when loading Google Drive images on GitHub Pages.
 * It uses the Google Drive thumbnail API which has better CORS support.
 */

const GoogleDriveProxy = {
    /**
     * Extract the file ID from a Google Drive URL
     * @param {string} url - The Google Drive URL
     * @returns {string|null} - The file ID or null if not found
     */
    extractFileId(url) {
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
     * Load a Google Drive image with fallback mechanisms
     * @param {string} driveUrl - The original Google Drive URL
     * @returns {Promise<string>} - A promise that resolves to a usable image URL
     */
    async loadImage(driveUrl) {
        // Extract the file ID
        const fileId = this.extractFileId(driveUrl);

        if (!fileId) {
            console.error('Could not extract file ID from URL:', driveUrl);
            throw new Error('Invalid Google Drive URL');
        }

        // Use the thumbnail API which has better CORS support
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;

        // Return the thumbnail URL directly without testing
        // This is more reliable than trying to test the URL first
        console.log('Using Google Drive thumbnail API:', thumbnailUrl);
        return thumbnailUrl;
    }
};

// Make sure GoogleDriveProxy is available globally
window.GoogleDriveProxy = GoogleDriveProxy;
