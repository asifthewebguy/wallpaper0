/**
 * Image Optimizer
 * Handles image compression and optimization for the wallpaper application
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageOptimizer {
    /**
     * Create a new ImageOptimizer instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            // Default configuration
            inputDir: 'wp',
            outputDir: 'wp-optimized',
            sizes: {
                small: { width: 640, quality: 70 },
                medium: { width: 1280, quality: 80 },
                large: { width: 1920, quality: 90 },
                original: { quality: 85 }
            },
            formats: {
                jpg: { quality: 85 },
                png: { compressionLevel: 8 },
                webp: { quality: 80 }
            },
            convertToWebP: true,
            keepOriginal: true,
            ...config
        };

        // Ensure output directories exist
        this.ensureDirectories();
    }

    /**
     * Ensure all necessary directories exist
     */
    ensureDirectories() {
        const baseDir = path.join(process.cwd(), this.config.outputDir);
        fs.mkdirSync(baseDir, { recursive: true });

        // Create size-specific directories if needed
        if (this.config.createSizeDirectories) {
            Object.keys(this.config.sizes).forEach(size => {
                fs.mkdirSync(path.join(baseDir, size), { recursive: true });
            });
        }

        // Create format-specific directories if needed
        if (this.config.createFormatDirectories) {
            Object.keys(this.config.formats).forEach(format => {
                fs.mkdirSync(path.join(baseDir, format), { recursive: true });
            });
        }
    }

    /**
     * Get the output path for an optimized image
     * @param {string} filename - Original filename
     * @param {string} size - Size category (small, medium, large, original)
     * @param {string} format - Output format (jpg, png, webp)
     * @returns {string} - Output path
     */
    getOutputPath(filename, size, format) {
        const basename = path.basename(filename, path.extname(filename));
        let outputPath = path.join(process.cwd(), this.config.outputDir);

        // Add size directory if configured
        if (this.config.createSizeDirectories) {
            outputPath = path.join(outputPath, size);
        } else {
            // Otherwise, add size suffix to filename
            if (size !== 'original') {
                outputPath = path.join(outputPath, `${basename}-${size}`);
            } else {
                outputPath = path.join(outputPath, basename);
            }
        }

        // Add format directory if configured
        if (this.config.createFormatDirectories && !this.config.createSizeDirectories) {
            outputPath = path.join(outputPath, format);
        }

        // Add extension
        return `${outputPath}.${format}`;
    }

    /**
     * Optimize a single image
     * @param {string} inputPath - Path to the input image
     * @returns {Promise<Array>} - Array of processed image paths
     */
    async optimizeImage(inputPath) {
        const filename = path.basename(inputPath);
        const ext = path.extname(inputPath).toLowerCase().substring(1);
        const outputPaths = [];

        // Skip non-image files
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
            console.log(`Skipping non-image file: ${filename}`);
            return outputPaths;
        }

        try {
            // Load the image with sharp
            let image = sharp(inputPath);
            const metadata = await image.metadata();

            // Process each size
            for (const [sizeName, sizeConfig] of Object.entries(this.config.sizes)) {
                // Skip original size if the image is smaller
                if (sizeName !== 'original' && metadata.width <= sizeConfig.width) {
                    continue;
                }

                // Resize the image if needed
                let processedImage = image;
                if (sizeName !== 'original') {
                    processedImage = image.clone().resize({
                        width: sizeConfig.width,
                        height: null, // Maintain aspect ratio
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                }

                // Process each format
                for (const [formatName, formatConfig] of Object.entries(this.config.formats)) {
                    // Skip if not the original format and convertToWebP is false
                    if (formatName !== ext && formatName !== 'webp' && !this.config.convertToOtherFormats) {
                        continue;
                    }

                    // Skip if it's not the original format and not webp when convertToWebP is true
                    if (formatName !== ext && formatName !== 'webp' && this.config.convertToWebP) {
                        continue;
                    }

                    // Skip if it's webp and convertToWebP is false
                    if (formatName === 'webp' && !this.config.convertToWebP) {
                        continue;
                    }

                    // Get the output path
                    const outputPath = this.getOutputPath(filename, sizeName, formatName);

                    // Apply format-specific processing
                    let formatImage = processedImage.clone();

                    if (formatName === 'jpg' || formatName === 'jpeg') {
                        await formatImage
                            .jpeg({ quality: formatConfig.quality })
                            .toFile(outputPath);
                    } else if (formatName === 'png') {
                        await formatImage
                            .png({ compressionLevel: formatConfig.compressionLevel })
                            .toFile(outputPath);
                    } else if (formatName === 'webp') {
                        await formatImage
                            .webp({ quality: formatConfig.quality })
                            .toFile(outputPath);
                    }

                    outputPaths.push(outputPath);
                    console.log(`Optimized: ${outputPath}`);
                }
            }

            return outputPaths;
        } catch (error) {
            console.error(`Error optimizing ${filename}:`, error);
            return outputPaths;
        }
    }

    /**
     * Optimize all images in the input directory
     * @returns {Promise<Array>} - Array of all processed image paths
     */
    async optimizeAll() {
        const inputDir = path.join(process.cwd(), this.config.inputDir);

        // Check if input directory exists
        if (!fs.existsSync(inputDir)) {
            console.error(`Input directory ${inputDir} does not exist`);
            return [];
        }

        const files = fs.readdirSync(inputDir);
        const allOutputPaths = [];

        console.log(`Processing ${files.length} files from ${inputDir}`);

        for (const file of files) {
            const inputPath = path.join(inputDir, file);

            // Check if file exists and is a file (not a directory)
            if (fs.existsSync(inputPath) && fs.statSync(inputPath).isFile()) {
                try {
                    const outputPaths = await this.optimizeImage(inputPath);
                    allOutputPaths.push(...outputPaths);
                } catch (error) {
                    console.error(`Error processing ${file}:`, error);
                }
            }
        }

        console.log(`Optimization complete. Processed ${allOutputPaths.length} images.`);
        return allOutputPaths;
    }
}

module.exports = ImageOptimizer;

// If this file is run directly, optimize all images
if (require.main === module) {
    // Load configuration if available
    let config;
    try {
        config = require('./config');
        console.log('Loaded configuration from config.js');
    } catch (error) {
        console.warn('Could not load config.js, using default settings');
        config = {};
    }

    const optimizer = new ImageOptimizer(config.imageOptimization || {});
    optimizer.optimizeAll()
        .then(() => console.log('Image optimization complete'))
        .catch(error => console.error('Error during image optimization:', error));
}
