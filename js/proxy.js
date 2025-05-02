/**
 * Google Drive Image Proxy for GitHub Pages
 * 
 * This script provides a workaround for CORS issues when loading Google Drive images on GitHub Pages.
 * It uses a combination of techniques to load images from Google Drive:
 * 
 * 1. Direct loading (may fail due to CORS)
 * 2. Using public CORS proxies
 * 3. Using the Google Drive thumbnail API as a fallback
 */

const GoogleDriveProxy = {
    /**
     * List of public CORS proxies to try
     */
    proxies: [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?'
    ],
    
    /**
     * Get a proxied URL for a Google Drive image
     * @param {string} driveUrl - The original Google Drive URL
     * @returns {string} - The proxied URL
     */
    getProxiedUrl(driveUrl) {
        // Try to extract the file ID from the Google Drive URL
        const fileId = this.extractFileId(driveUrl);
        
        if (fileId) {
            // Use Google Drive thumbnail API as a more reliable alternative
            // This often works better with CORS than the direct download link
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
        }
        
        // If we couldn't extract the file ID, use a random proxy
        const randomProxy = this.proxies[Math.floor(Math.random() * this.proxies.length)];
        return `${randomProxy}${encodeURIComponent(driveUrl)}`;
    },
    
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
        // First try direct loading
        try {
            const directResult = await this.testImageUrl(driveUrl);
            if (directResult) {
                console.log('Direct Google Drive URL worked!');
                return driveUrl;
            }
        } catch (error) {
            console.warn('Direct Google Drive URL failed:', error.message);
        }
        
        // Try the thumbnail API
        const fileId = this.extractFileId(driveUrl);
        if (fileId) {
            const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
            try {
                const thumbnailResult = await this.testImageUrl(thumbnailUrl);
                if (thumbnailResult) {
                    console.log('Google Drive thumbnail API worked!');
                    return thumbnailUrl;
                }
            } catch (error) {
                console.warn('Google Drive thumbnail API failed:', error.message);
            }
        }
        
        // Try each proxy in sequence
        for (const proxy of this.proxies) {
            const proxiedUrl = `${proxy}${encodeURIComponent(driveUrl)}`;
            try {
                const proxyResult = await this.fetchWithProxy(proxiedUrl);
                if (proxyResult) {
                    console.log(`Proxy ${proxy} worked!`);
                    return proxyResult;
                }
            } catch (error) {
                console.warn(`Proxy ${proxy} failed:`, error.message);
            }
        }
        
        // If all methods fail, throw an error
        throw new Error('All methods to load Google Drive image failed');
    },
    
    /**
     * Test if an image URL can be loaded directly
     * @param {string} url - The image URL to test
     * @returns {Promise<boolean>} - A promise that resolves to true if the image can be loaded
     */
    testImageUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(true);
            img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
            
            img.src = url;
        });
    },
    
    /**
     * Fetch an image through a proxy and return an object URL
     * @param {string} proxiedUrl - The proxied URL
     * @returns {Promise<string>} - A promise that resolves to an object URL
     */
    async fetchWithProxy(proxiedUrl) {
        try {
            const response = await fetch(proxiedUrl);
            if (!response.ok) {
                throw new Error(`Proxy request failed with status ${response.status}`);
            }
            
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            throw error;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleDriveProxy;
} else {
    window.GoogleDriveProxy = GoogleDriveProxy;
}
