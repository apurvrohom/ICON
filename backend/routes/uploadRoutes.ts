import { Router, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Use memory storage to allow streaming or writing buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configuration loaded successfully.');
} else {
  console.warn('Cloudinary credentials missing in .env. Falling back to local disk storage uploads.');
}

router.post('/', protect, upload.single('file'), (req: AuthRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  if (isCloudinaryConfigured()) {
    // Stream upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'icon_platform', resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
          return;
        }
        res.json({
          name: req.file!.originalname,
          url: result?.secure_url,
          type: req.file!.mimetype
        });
      }
    );
    stream.end(req.file.buffer);
  } else {
    try {
      // Fallback: Write buffer to local uploads folder
      const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      
      res.json({
        name: req.file.originalname,
        url: fileUrl,
        type: req.file.mimetype
      });
    } catch (err: any) {
      console.error('Local upload fallback error:', err);
      res.status(500).json({ message: 'Local storage save failed', error: err.message });
    }
  }
});

export default router;
