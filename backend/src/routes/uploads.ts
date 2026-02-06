import express from 'express';
import { upload } from '../middleware/upload';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Upload single image
router.post('/', authenticateJWT, upload.single('image'), (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Return the accessible URL
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error: any) {
        console.error('Upload route error:', error);
        res.status(500).json({ success: false, error: error.message || 'File upload failed' });
    }
});

export default router;
