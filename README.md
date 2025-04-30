# Wallpaper Viewer

A simple web application that displays images from the `/wp` folder as fullscreen backgrounds in random order.

## Features

- Displays images as fullscreen backgrounds
- Shows images in random order
- Provides navigation controls (previous, next, random)
- Keyboard shortcuts (left arrow, right arrow, 'r' for random)
- API endpoints to get images by ID or randomly
- Works on GitHub Pages with static API endpoints

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

## Automatic API Generation

This repository includes a GitHub Action that automatically generates the API files whenever new images are added to the `/wp` folder. The workflow:

1. Triggers when changes are pushed to the `wp` directory
2. Runs the `generate-data` script to create all necessary API files
3. Updates the `index.html` file
4. Commits and pushes the changes back to the repository

This ensures that the API always stays in sync with the images in the `/wp` folder without requiring manual intervention.

You can also manually trigger this workflow from the "Actions" tab in the GitHub repository.

## License

MIT
