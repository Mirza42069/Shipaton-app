export function scanDocument(_options: { maxNumDocuments?: number; croppedImageQuality?: number }) {
  return Promise.reject(new Error("Document scanning is available in the Android app."));
}
