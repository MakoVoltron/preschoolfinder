const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
    // secure: true
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'PreschoolFinder',
        allowedFormats: ['jpeg', 'png', 'jpg'],
        upload_preset: 'image_optimize_500w'
    }
});

const businessProof = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'PreschoolFinder/BusinessProof',
        allowedFormats: ['jpeg', 'png', 'jpg'],
        upload_preset: 'image_optimize_500w'
    }
});

module.exports = {
    cloudinary,
    storage,
    businessProof
}