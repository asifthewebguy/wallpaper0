# Wallpaper Viewer

A simple web application that displays images from the `/wp` folder as fullscreen backgrounds in random order.

## Features

- Displays images as fullscreen backgrounds
- Shows images in random order
- Provides navigation controls (previous, next, random)
- Keyboard shortcuts (left arrow, right arrow, 'r' for random)
- API endpoints to get images by ID or randomly
- Works on GitHub Pages with static API endpoints
- Google Drive integration for image hosting
- Fallback to local images if Google Drive is unavailable
- Loading indicators and error handling
- "Set as Desktop Background" button with [wallpaper0-changer](https://github.com/asifthewebguy/wallpaper0-changer) integration

## API Endpoints

The application provides the following API endpoints that work both locally and on GitHub Pages:

- `/api/images.json` - Get all image IDs
- `/api/images/{id}.json` - Get information about a specific image by ID
- `/api/images/{id}.html` - Redirect to the actual image file
- `/api/random/index.html` - Get a random image ID

API documentation is available at `/api/index.html` when the application is running.

### Example Usage

```javascript
// Get all image IDs
fetch('/api/images.json')
  .then(response => response.json())
  .then(images => console.log(images));

// Get a specific image by ID
fetch('/api/images/image1.jpg.json')
  .then(response => response.json())
  .then(imageData => console.log(imageData));

// Get a random image
fetch('/api/random/index.html')
  .then(response => response.json())
  .then(randomImage => console.log(randomImage));
```

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Generate image data and API endpoints:
   ```
   npm run generate-data
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## GitHub Pages Deployment

This application is designed to work with GitHub Pages. To deploy:

1. Generate the image data and API endpoints:
   ```
   npm run generate-data
   ```

2. Build the application:
   ```
   npm run build
   ```

3. Commit and push to GitHub

4. Enable GitHub Pages in your repository settings

## Google Drive Integration

This application supports hosting images on Google Drive to save GitHub repository space. The integration:

1. Maps local image filenames to Google Drive file IDs
2. Automatically uses Google Drive URLs when available
3. Falls back to local images if Google Drive is unavailable
4. Shows loading indicators and error messages
5. Displays the image source (Google Drive or local)

### Setting Up Google Drive Integration

1. Create a `google-drive-mapping.json` file that maps local filenames to Google Drive file IDs:
   ```json
   {
     "image1.jpg": "GOOGLE_DRIVE_FILE_ID_1",
     "image2.png": "GOOGLE_DRIVE_FILE_ID_2"
   }
   ```

2. Make sure your Google Drive images are publicly accessible (anyone with the link can view)

3. Use the included `upload-to-drive.js` utility to upload images and generate the mapping file:
   ```
   npm install googleapis readline-sync fs-extra
   node upload-to-drive.js
   ```

4. Configure the integration in `config.js`:
   ```javascript
   const config = {
     useGoogleDrive: true,  // Set to false to disable Google Drive integration
     fallbackToLocal: true, // Try local files if Google Drive fails
     // ... other settings
   };
   ```

## Automatic API Generation

This repository includes a GitHub Action that automatically generates the API files. The workflow:

1. Triggers when changes are pushed to the `wp` directory, `google-drive-mapping.json`, or `config.js`
2. Runs the `generate-data` script to create all necessary API files
3. Updates the `index.html` file
4. Commits and pushes the changes back to the repository

This ensures that the API always stays in sync with your images without requiring manual intervention.

You can also manually trigger this workflow from the "Actions" tab in the GitHub repository.

## Desktop Wallpaper Integration

This application integrates with [wallpaper0-changer](https://github.com/asifthewebguy/wallpaper0-changer), a Windows application that allows you to set any image from this viewer as your desktop background with a single click.

### Features

- One-click "Set as Desktop Background" button on each image
- Custom URL protocol handler (`wallpaper0-changer:`) for seamless integration
- Automatically downloads and sets the selected image as your desktop wallpaper
- Runs in the system tray with minimal interference

### Installation

1. Download the [latest release of wallpaper0-changer](https://github.com/asifthewebguy/wallpaper0-changer/releases/latest)
2. Run the `install.ps1` script with PowerShell
3. Follow the on-screen instructions to complete the installation

### Usage

Once installed, simply click the "Set as Desktop Background" button on any image in the wallpaper viewer. The wallpaper0-changer application will automatically download the image and set it as your desktop background.

## License

MIT
