# Security Measures

This document outlines the security measures implemented in the wallpaper application to protect sensitive files and data.

## Protected Files

The following files contain sensitive information and are protected from public access:

- `credentials.json`: Contains Google API credentials
- `token.json`: Contains OAuth tokens for Google API
- `google-drive-mapping.json`: Maps local filenames to Google Drive file IDs
- `upload-to-drive.js`: Script for uploading images to Google Drive
- `test-credentials.js`: Script for testing Google API credentials
- `test-drive-integration.js`: Script for testing Google Drive integration

## Security Layers

### 1. Git Protection

- All sensitive files are added to `.gitignore` to prevent them from being committed to the repository
- This ensures that credentials and tokens are not exposed in the public repository

### 2. Server-Side Protection

- Express middleware blocks direct access to sensitive files
- Returns a 403 Forbidden response for any requests to these files

### 3. Apache Protection (if applicable)

- `.htaccess` file blocks access to sensitive files
- Disables directory browsing
- Prevents script execution in the uploads directory
- Adds security headers to prevent common web vulnerabilities

### 4. Search Engine Protection

- `robots.txt` file prevents search engines from indexing sensitive files

## Best Practices

1. **Keep credentials secure**: Never share your `credentials.json` or `token.json` files
2. **Regular rotation**: Periodically rotate your Google API credentials
3. **Least privilege**: Ensure your Google API credentials have only the permissions they need
4. **Monitoring**: Regularly check your Google Cloud Console for unusual activity
5. **Updates**: Keep all dependencies updated to patch security vulnerabilities

## In Case of Compromise

If you believe your credentials have been compromised:

1. Immediately revoke the compromised credentials in the Google Cloud Console
2. Generate new credentials
3. Update your local `credentials.json` file
4. Delete any existing `token.json` file to force re-authentication

## Additional Resources

- [Google API Security Best Practices](https://cloud.google.com/docs/security/best-practices)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Web_Security_Testing_Cheat_Sheet.html)
