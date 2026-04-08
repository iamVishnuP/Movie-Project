const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dujnvidrw',
  api_key: process.env.CLOUDINARY_API_KEY || '266984733355967',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'aKzlZ0JUv5pkZtl2FUD2PPHOAr8',
});

/**
 * Uploads a base64 encoded string to Cloudinary.
 * @param {string} base64String - The base64 string directly from the client.
 * @param {string} folder - The destination folder on Cloudinary.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
exports.uploadImage = async (base64String, folder) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folder,
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Explicit return format
    throw new Error(error.message || 'Direct Image upload failed inside Cloudinary SDK');
  }
};
