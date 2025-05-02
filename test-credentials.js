/**
 * Test script to verify that the credentials.json file is valid
 * Run this script after you have created the credentials.json file
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

// Path to credentials file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
// The file token.json stores the user's access and refresh tokens
const TOKEN_PATH = path.join(__dirname, 'token.json');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

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
 * List files in Google Drive
 */
async function listFiles(auth) {
  const drive = google.drive({ version: 'v3', auth });
  try {
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, mimeType)',
    });
    const files = res.data.files;
    if (files.length) {
      console.log('Files in your Google Drive:');
      files.forEach((file) => {
        console.log(`${file.name} (${file.id}) [${file.mimeType}]`);
      });
    } else {
      console.log('No files found.');
    }
    return files;
  } catch (err) {
    console.error('The API returned an error:', err);
    throw err;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('Error: credentials.json file not found.');
      console.log('Please follow the setup instructions in GOOGLE-DRIVE-SETUP.md to create the credentials.json file.');
      return;
    }
    
    console.log('Found credentials.json file. Testing authentication...');
    
    // Authorize and get client
    const auth = await authorize();
    console.log('Authentication successful!');
    
    // List files in Google Drive
    console.log('\nListing files in your Google Drive:');
    await listFiles(auth);
    
    console.log('\nTest completed successfully!');
    console.log('Your credentials.json file is valid and you are authenticated with Google Drive.');
    console.log('You can now use the upload-to-drive.js script to upload images and generate the mapping file.');
    
  } catch (err) {
    console.error('Error in main function:', err);
  }
}

// Run the script
main().catch(console.error);
