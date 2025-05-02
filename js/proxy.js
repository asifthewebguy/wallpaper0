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
      const thumbnailUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w2000";
      console.log("Using Google Drive thumbnail API:", thumbnailUrl);
      resolve(thumbnailUrl);
    });
  }
};
