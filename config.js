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

  // Lazy loading settings
  lazyLoading: {
    enabled: true,                // Enable lazy loading
    preloadThreshold: 2,          // Number of images to preload in each direction
    preloadDelay: 300,            // Delay before preloading adjacent images (ms)
    queueSize: 5,                 // Maximum number of images to keep in memory
    prioritizeVisible: true,      // Prioritize loading of currently visible images
    unloadThreshold: 10           // Unload images when they are this many positions away
  },

  // Responsive image settings
  responsive: {
    enabled: true,                // Enable responsive images
    sizes: {
      small: {
        maxWidth: 640,            // Max width in pixels
        quality: 70               // Quality percentage (for Google Drive)
      },
      medium: {
        maxWidth: 1280,
        quality: 80
      },
      large: {
        maxWidth: 1920,
        quality: 90
      },
      xlarge: {
        maxWidth: 2560,
        quality: 100
      }
    },
    // Function to determine size based on screen dimensions
    getSizeForScreen: function() {
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      if (width <= 640) return 'small';
      if (width <= 1280) return 'medium';
      if (width <= 1920) return 'large';
      return 'xlarge';
    }
  },

  // UI settings
  showImageSource: true,          // Show whether image is from Google Drive or local
  transitionDuration: 1000,       // Transition duration in milliseconds
  showLoadingIndicator: true,     // Show loading indicator during image transitions

  // Error handling
  maxRetryAttempts: 3,            // Number of times to retry loading an image
  retryDelay: 1000,               // Delay between retries in milliseconds

  // Image optimization settings
  imageOptimization: {
    enabled: false,               // Disable image optimization for now
    inputDir: 'wp',               // Directory containing original images
    outputDir: 'wp-optimized',    // Directory for optimized images
    useOptimizedImages: false,    // Use original images in the application
    createSizeDirectories: false, // Whether to create separate directories for each size
    createFormatDirectories: false, // Whether to create separate directories for each format
    convertToWebP: true,          // Convert images to WebP format
    keepOriginal: true,           // Keep original size images
    sizes: {
      small: {
        width: 640,               // Width in pixels
        quality: 70               // Quality percentage
      },
      medium: {
        width: 1280,
        quality: 80
      },
      large: {
        width: 1920,
        quality: 90
      },
      original: {
        quality: 85               // Quality for original size
      }
    },
    formats: {
      jpg: { quality: 85 },
      png: { compressionLevel: 8 },
      webp: { quality: 80 }
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.appConfig = config;
}
