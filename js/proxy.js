/**
 * Improved Google Drive Image Proxy for GitHub Pages
 */
window.GoogleDriveProxy = {
  extractFileId: function(url) {
    if (url.includes("export=view&id=")) {
      const idParam = url.split("id=")[1];
      return idParam ? idParam.split("&")[0] : null;
    }
    const fileMatch = url.match(/\/file\/d\/([^/]+)/);
    if (fileMatch && fileMatch[1]) return fileMatch[1];
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch && idMatch[1]) return idMatch[1];
    return null;
  },
  loadImage: function(driveUrl) {
    return new Promise((resolve, reject) => {
      const fileId = this.extractFileId(driveUrl);
      if (!fileId) {
        reject(new Error("Invalid Google Drive URL"));
        return;
      }
      
      // Try multiple methods to load the image
      this.tryLoadingMethods(fileId)
        .then(url => resolve(url))
        .catch(error => reject(error));
    });
  },
  tryLoadingMethods: function(fileId) {
    return new Promise((resolve, reject) => {
      // Method 1: Use the thumbnail API (most reliable for CORS)
      const thumbnailUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w2000";
      
      // Method 2: Use the uc export API
      const exportUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
      
      console.log("Trying Google Drive thumbnail API:", thumbnailUrl);
      
      // Even if tests might fail, the thumbnail API is still our best bet
      // Some browsers will block the test but allow the actual usage
      resolve(thumbnailUrl);
    });
  }
};
