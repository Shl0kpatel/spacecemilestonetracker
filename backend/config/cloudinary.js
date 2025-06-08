const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'milestone-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});

// Configure storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'milestone-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv'],
    transformation: [{ width: 1280, height: 720, crop: 'limit', duration: 30 }],
  },
});

// Create multer instances
const uploadImage = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
});

const uploadVideo = multer({ 
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
});

// Universal upload middleware that handles both images and videos
const uploadMedia = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder: isVideo ? 'milestone-videos' : 'milestone-images',
        resource_type: isVideo ? 'video' : 'image',
        allowed_formats: isVideo ? ['mp4', 'mov', 'avi', 'wmv'] : ['jpg', 'jpeg', 'png', 'gif'],
        transformation: isVideo 
          ? [{ width: 1280, height: 720, crop: 'limit', duration: 30 }]
          : [{ width: 800, height: 600, crop: 'limit' }],
      };
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  },
});

module.exports = { cloudinary, uploadImage, uploadVideo, uploadMedia };
