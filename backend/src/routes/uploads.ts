import express from 'express';
import fs from 'fs';
import path from 'path';
import { upload } from '../middleware/upload';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();
const uploadsRoot = path.join(process.cwd(), 'uploads');

// Upload single image
router.post('/', authenticateJWT, upload.single('image'), (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Serve through /api/uploads/* to avoid proxy conflicts with frontend static assets
        const fileUrl = `/api/uploads/${req.file.filename}`;
        console.log('[uploads] stored file', {
            filename: req.file.filename,
            path: req.file.path,
            servedAs: fileUrl
        });

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

router.get('/:filename', (req, res) => {
    const fileName = path.basename(req.params.filename || '');
    if (!fileName) {
        return res.status(404).end();
    }

    const filePath = path.join(uploadsRoot, fileName);
    if (!fs.existsSync(filePath)) {
        console.warn('[uploads] file not found', { fileName, filePath });
        return res.status(404).end();
    }

    return res.sendFile(filePath);
});

export default router;
