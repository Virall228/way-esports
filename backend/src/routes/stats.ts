import express from 'express';
import { getPublicStats } from '../controllers/statsController';

const router = express.Router();

// Publicly accessible statistics
router.get('/', getPublicStats);

export default router;
