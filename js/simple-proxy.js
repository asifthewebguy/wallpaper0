/**
 * Simple Google Drive Image Proxy for GitHub Pages
 * 
 * This script provides a workaround for CORS issues when loading Google Drive images on GitHub Pages.
 * It uses the Google Drive thumbnail API which has better CORS support.
 */

// Define the GoogleDriveProxy object in the global scope
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
     * Load a Google Drive image with fallback mechanisms
     * @param {string} driveUrl - The original Google Drive URL
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
            
            // Use the thumbnail API which has better CORS support
            const thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';
            console.log('Using Google Drive thumbnail API:', thumbnailUrl);
            resolve(thumbnailUrl);
        });
    }
};
