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
 * Upload a file to Google Drive
 */
async function uploadFile(auth, filePath) {
  const drive = google.drive({ version: 'v3', auth });
  const fileName = path.basename(filePath);
  
  try {
    console.log(`Uploading ${fileName}...`);
    
    const fileMetadata = {
      name: fileName,
      parents: ['root'] // Upload to root folder, change if needed
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
    const uploadAll = readlineSync.keyInYNStrict('Upload all images to Google Drive?');
    
    let filesToUpload = [];
    if (uploadAll) {
      filesToUpload = files;
    } else {
      // Let user select files
      filesToUpload = readlineSync.keyInSelect(files, 'Select a file to upload (or 0 to cancel)', { cancel: 'Cancel' });
      if (filesToUpload === -1) {
        console.log('Upload cancelled.');
        return;
      }
      filesToUpload = [files[filesToUpload]];
    }
    
    // Authorize and get client
    const auth = await authorize();
    
    // Upload files and collect mappings
    const newMappings = {};
    for (const file of filesToUpload) {
      const filePath = path.join(IMAGES_DIR, file);
      const result = await uploadFile(auth, filePath);
      
      if (result) {
        newMappings[result.fileName] = result.fileId;
      }
    }
    
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
