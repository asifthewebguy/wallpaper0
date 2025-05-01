/**
 * Configuration file for the wallpaper application
 * Controls various settings including Google Drive integration
 */

const config = {
  // Google Drive Integration
  useGoogleDrive: true,           // Set to false to disable Google Drive integration
  fallbackToLocal: true,          // Try local files if Google Drive fails
  
  // Paths and URLs
  googleDriveBaseUrl: 'https://drive.google.com/uc?export=view&id=',
  localImagePath: 'wp/',
  
  // Performance settings
  preloadAdjacentImages: true,    // Preload next and previous images
  cacheImages: true,              // Cache image data in memory
  
  // UI settings
  showImageSource: true,          // Show whether image is from Google Drive or local
  transitionDuration: 1000,       // Transition duration in milliseconds
  
  // Error handling
  maxRetryAttempts: 3,            // Number of times to retry loading an image
  retryDelay: 1000                // Delay between retries in milliseconds
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.appConfig = config;
}
