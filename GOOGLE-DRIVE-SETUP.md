# Google Drive Integration Setup Guide

This guide will walk you through the process of setting up Google Drive integration for your wallpaper application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click on "New Project"
4. Enter a name for your project (e.g., "Wallpaper App")
5. Click "Create"

## Step 2: Enable the Google Drive API

1. Select your newly created project from the project dropdown
2. In the left sidebar, navigate to "APIs & Services" > "Library"
3. Search for "Google Drive API"
4. Click on "Google Drive API" in the results
5. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. In the left sidebar, navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" as the user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - App name: "Wallpaper App" (or your preferred name)
   - User support email: Your email address
   - Developer contact information: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the scope: `https://www.googleapis.com/auth/drive.file`
8. Click "Save and Continue"
9. On the "Test users" page, click "Add Users" and add your Google email address
10. Click "Save and Continue"
11. Review your app information and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" at the top of the page
3. Select "OAuth client ID"
4. For Application type, select "Desktop application"
5. Enter a name for your OAuth client (e.g., "Wallpaper App Desktop Client")
6. Click "Create"
7. You'll see a popup with your client ID and client secret. Click "OK"
8. Find your newly created OAuth client in the list and click the download icon (↓) on the right
9. This will download a JSON file - rename it to `credentials.json`
10. Move this `credentials.json` file to the root directory of your wallpaper application

## Step 5: Upload Images to Google Drive

1. Create a folder in your Google Drive to store the wallpaper images
2. Upload some test images to this folder
3. For each image:
   - Right-click on the image and select "Get link"
   - Click "Share" and make sure "Anyone with the link" is selected
   - Copy the link (it will look like `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`)
   - Extract the FILE_ID part from the link (it's the long string between `/d/` and `/view`)

## Step 6: Update the Mapping File

1. Open the `google-drive-mapping.json` file
2. Add entries for each image you uploaded:
   ```json
   {
     "README": "This file maps local image filenames to Google Drive file IDs.",
     "image1.jpg": "GOOGLE_DRIVE_FILE_ID_1",
     "image2.png": "GOOGLE_DRIVE_FILE_ID_2"
   }
   ```
3. Replace `image1.jpg` with the actual filename in your `wp` directory
4. Replace `GOOGLE_DRIVE_FILE_ID_1` with the actual file ID from Google Drive

## Step 7: Use the Upload Script

Alternatively, you can use the `upload-to-drive.js` script to automate the process:

1. Make sure you have the `credentials.json` file in the project root
2. Install the required dependencies:
   ```
   npm install googleapis readline-sync fs-extra
   ```
3. Run the upload script:
   ```
   node upload-to-drive.js
   ```
4. Follow the prompts to select and upload images
5. The script will automatically update the mapping file

## Step 8: Generate API Files

1. Run the generate-image-data.js script to create API files with Google Drive URLs:
   ```
   npm run generate-data
   ```
2. This will create API files that use Google Drive URLs for images that have mappings

## Step 9: Test the Application

1. Start the application:
   ```
   npm start
   ```
2. Open your browser and navigate to the application
3. Verify that images are loading from Google Drive
4. Test the fallback mechanism by temporarily disabling your internet connection

## Troubleshooting

- If you encounter CORS issues, make sure your Google Drive files are shared with "Anyone with the link"
- If images fail to load, check the browser console for errors
- If the upload script fails, make sure your `credentials.json` file is valid and you have granted the necessary permissions

## Security Considerations

- Keep your `credentials.json` and `token.json` files secure and do not commit them to public repositories
- Add them to your `.gitignore` file
- The Google Drive API has usage quotas. For personal use, these are typically more than sufficient, but be aware of them if you're uploading many files
