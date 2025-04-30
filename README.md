# Wallpaper Viewer

A simple web application that displays images from the `/wp` folder as fullscreen backgrounds in random order.

## Features

- Displays images as fullscreen backgrounds
- Shows images in random order
- Provides navigation controls (previous, next, random)
- Keyboard shortcuts (left arrow, right arrow, 'r' for random)
- API endpoints to get images by ID or randomly

## API Endpoints

- `/api/images` - Get all image IDs
- `/api/images/:id` - Get a specific image by ID
- `/api/random` - Get a random image

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Generate image data:
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

1. Generate the image data:
   ```
   npm run generate-data
   ```

2. Build the application:
   ```
   npm run build
   ```

3. Commit and push to GitHub

4. Enable GitHub Pages in your repository settings

## License

MIT
