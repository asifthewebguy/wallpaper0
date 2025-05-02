/**
 * Utility script to upload images to Google Drive and update the mapping file
 *
 * Prerequisites:
 * 1. Install required packages:
 *    npm install googleapis readline-sync fs-extra
 *
 * 2. Set up Google Drive API credentials:
 *    - Go to https://console.cloud.google.com/
 *    - Create a new project
 *    - Enable the Google Drive API
 *    - Create OAuth 2.0 credentials (Desktop application)
 *    - Download the credentials JSON file and save it as 'credentials.json' in this directory
 *
 * Usage:
 *    node upload-to-drive.js
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const readlineSync = require('readline-sync');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
// The file token.json stores the user's access and refresh tokens
const TOKEN_PATH = path.join(__dirname, 'token.json');
// Path to credentials file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
// Path to Google Drive mapping file
const MAPPING_PATH = path.join(__dirname, 'google-drive-mapping.json');
// Path to images directory
const IMAGES_DIR = path.join(__dirname, 'wp');
// Google Drive folder ID to upload to
const DRIVE_FOLDER_ID = '17pqu3r4huitFvwFo6L_leT8HUzCIdkVN';

/**
 * Get and store new token after prompting for user authorization
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error retrieving access token', err);
          reject(err);
          return;
        }
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials
 */
async function authorize() {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
    );

    // Check if we have previously stored a token
    try {
      const token = fs.readFileSync(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client;
    } catch (err) {
      return getNewToken(oAuth2Client);
    }
  } catch (err) {
    console.error('Error loading client secret file:', err);
    throw err;
  }
}

/**
 * Check if the specified folder exists and is accessible, or create it if it doesn't exist
 */
async function checkFolderAccess(auth) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log(`Checking access to folder with ID: ${DRIVE_FOLDER_ID}...`);

    try {
      const response = await drive.files.get({
        fileId: DRIVE_FOLDER_ID,
        fields: 'name,mimeType'
      });

      if (response.data.mimeType === 'application/vnd.google-apps.folder') {
        console.log(`Folder access confirmed: "${response.data.name}"`);
        return DRIVE_FOLDER_ID;
      } else {
        console.error(`The ID ${DRIVE_FOLDER_ID} exists but is not a folder.`);
        return await createFolder(drive);
      }
    } catch (err) {
      if (err.code === 404) {
        console.log(`Folder with ID ${DRIVE_FOLDER_ID} not found. Creating a new folder...`);
        return await createFolder(drive);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(`Error accessing folder: ${err.message}`);
    if (err.code === 403) {
      console.error(`You don't have permission to access this folder.`);
    }
    return false;
  }
}

/**
 * Create a new folder in Google Drive
 */
async function createFolder(drive) {
  try {
    const folderName = 'Wallpapers-' + new Date().toISOString().split('T')[0];

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id,name'
    });

    console.log(`Created new folder: "${response.data.name}" with ID: ${response.data.id}`);

    // Make the folder publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log(`Folder is now publicly accessible`);

    return response.data.id;
  } catch (err) {
    console.error(`Error creating folder: ${err.message}`);
    return false;
  }
}

/**
 * Upload a file to Google Drive
 */
async function uploadFile(auth, filePath) {
  const drive = google.drive({ version: 'v3', auth });
  const fileName = path.basename(filePath);

  try {
    console.log(`Uploading ${fileName}...`);

    const fileMetadata = {
      name: fileName,
      parents: [global.ACTIVE_FOLDER_ID || DRIVE_FOLDER_ID] // Upload to the active folder
    };

    const media = {
      mimeType: getMimeType(filePath),
      body: fs.createReadStream(filePath)
    };

    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    console.log(`${fileName} uploaded successfully. File ID: ${res.data.id}`);

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log(`${fileName} is now publicly accessible`);

    return {
      fileName: fileName,
      fileId: res.data.id
    };
  } catch (err) {
    console.error(`Error uploading ${fileName}:`, err.message);
    return null;
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Update the Google Drive mapping file
 */
function updateMappingFile(newMappings) {
  let mapping = {};

  // Load existing mapping if it exists
  if (fs.existsSync(MAPPING_PATH)) {
    try {
      const content = fs.readFileSync(MAPPING_PATH, 'utf8');
      mapping = JSON.parse(content);

      // Keep README entry if it exists
      const readme = mapping.README;

      // Add new mappings
      mapping = { ...mapping, ...newMappings };

      // Restore README if it existed
      if (readme) {
        mapping.README = readme;
      }
    } catch (err) {
      console.error('Error reading mapping file:', err);
      mapping = newMappings;
    }
  } else {
    mapping = {
      README: "This file maps local image filenames to Google Drive file IDs.",
      ...newMappings
    };
  }

  // Write updated mapping to file
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2));
  console.log(`Updated mapping file with ${Object.keys(newMappings).length} new entries`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('Error: credentials.json file not found.');
      console.log('Please follow the setup instructions in the comments at the top of this file.');
      return;
    }

    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`Error: Images directory not found at ${IMAGES_DIR}`);
      return;
    }

    // Get list of image files
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });

    if (files.length === 0) {
      console.log('No image files found in the wp directory.');
      return;
    }

    console.log(`Found ${files.length} image files.`);

    // Ask user which files to upload
    console.log('Upload options:');
    console.log('1. Upload all images');
    console.log('2. Upload a batch of images');
    console.log('3. Select a single image');

    const uploadOption = readlineSync.keyIn('Choose an option (1-3): ', {limit: '$<1-3>'});

    let filesToUpload = [];
    if (uploadOption === '1') {
      // Upload all images
      filesToUpload = files;
      console.log(`Will upload all ${files.length} images.`);
    } else if (uploadOption === '2') {
      // Upload a batch of images
      const batchSize = readlineSync.questionInt(`How many images to upload (max ${files.length})? `, {
        limitMessage: `Please enter a number between 1 and ${files.length}.`,
        limit: [1, files.length]
      });

      // Randomly select images or let user choose starting point
      const randomSelection = readlineSync.keyInYNStrict('Randomly select images?');
      if (randomSelection) {
        // Randomly select images
        const shuffled = [...files].sort(() => 0.5 - Math.random());
        filesToUpload = shuffled.slice(0, batchSize);
      } else {
        // Let user choose starting point
        const startIndex = readlineSync.questionInt(`Start from which image (1-${files.length - batchSize + 1})? `, {
          limitMessage: `Please enter a number between 1 and ${files.length - batchSize + 1}.`,
          limit: [1, files.length - batchSize + 1]
        }) - 1; // Convert to 0-based index

        filesToUpload = files.slice(startIndex, startIndex + batchSize);
      }

      console.log(`Will upload ${filesToUpload.length} images.`);
    } else {
      // Select a single image
      const selectedIndex = readlineSync.keyInSelect(files, 'Select a file to upload (or 0 to cancel)', { cancel: 'Cancel' });
      if (selectedIndex === -1) {
        console.log('Upload cancelled.');
        return;
      }
      filesToUpload = [files[selectedIndex]];
      console.log(`Will upload 1 image: ${filesToUpload[0]}`);
    }

    // Authorize and get client
    const auth = await authorize();

    // Check if the specified folder exists and is accessible, or create a new one
    const folderId = await checkFolderAccess(auth);
    if (!folderId) {
      console.error('Cannot proceed without access to a folder.');
      return;
    }

    // Update the folder ID if a new folder was created
    if (folderId !== DRIVE_FOLDER_ID) {
      console.log(`Using new folder ID: ${folderId}`);
      // Update the global variable for use in uploadFile
      global.ACTIVE_FOLDER_ID = folderId;
    } else {
      global.ACTIVE_FOLDER_ID = DRIVE_FOLDER_ID;
    }

    // Upload files and collect mappings
    const newMappings = {};
    const totalFiles = filesToUpload.length;

    console.log('\nStarting upload process...');
    console.log('='.repeat(50));

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const filePath = path.join(IMAGES_DIR, file);

      // Show progress
      const progress = Math.round(((i) / totalFiles) * 100);
      console.log(`[${progress}%] (${i+1}/${totalFiles}) Processing: ${file}`);

      const result = await uploadFile(auth, filePath);

      if (result) {
        newMappings[result.fileName] = result.fileId;
        console.log(`✓ Successfully uploaded and mapped: ${file} -> ${result.fileId}`);
      } else {
        console.log(`✗ Failed to upload: ${file}`);
      }

      console.log('-'.repeat(50));
    }

    console.log('='.repeat(50));
    console.log(`Upload process completed. ${Object.keys(newMappings).length}/${totalFiles} files uploaded successfully.`);

    // Update mapping file
    if (Object.keys(newMappings).length > 0) {
      updateMappingFile(newMappings);

      // Regenerate API files
      const regenerate = readlineSync.keyInYNStrict('Regenerate API files with new mappings?');
      if (regenerate) {
        console.log('Regenerating API files...');
        require('./generate-image-data');
      }
    } else {
      console.log('No files were successfully uploaded. Mapping file not updated.');
    }

  } catch (err) {
    console.error('Error in main function:', err);
  }
}

// Run the script
main().catch(console.error);
