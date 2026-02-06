import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import User from '../models/User';
import { logInfo } from '../services/loggingService';

const router = express.Router();

/**
 * Request a refund for a recent transaction
 */
router.post('/request', authenticateJWT, async (req, res) => {
    try {
        const { transactionId, reason } = req.body;
        const userId = (req.user as any)._id;

        if (!transactionId || !reason) {
            return res.status(400).json({ error: 'Transaction ID and reason are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the transaction in user's wallet
        const transaction = user.wallet.transactions.find(
            (t: any) => t._id.toString() === transactionId || t.reference === transactionId
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Check if eligible for refund (e.g., within 24 hours of purchase)
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        const hoursSinceTransaction = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceTransaction > 24) {
            return res.status(400).json({
                error: 'Refund period has expired. Refunds are only available within 24 hours of transaction.'
            });
        }

        // Check if it's already refunded or pending refund
        if (transaction.status === 'refunded' || transaction.status === 'refund_pending') {
            return res.status(400).json({ error: 'Refund already processed or pending' });
        }

        // Mark as refund pending for admin review
        transaction.status = 'refund_pending';
        transaction.refundReason = reason;
        transaction.refundRequestedAt = new Date();

        await user.save();

        logInfo('refund_requested', {
            userId,
            transactionId,
            amount: transaction.amount,
            reason
        });

        res.json({
            success: true,
            message: 'Refund request submitted and is under review.',
            transaction: {
                id: (transaction as any)._id,
                status: transaction.status,
                amount: transaction.amount
            }
        });
    } catch (error) {
        console.error('Refund request failed:', error);
        res.status(500).json({ error: 'Failed to process refund request' });
    }
});

/**
 * Get user's refund requests
 */
router.get('/my-requests', authenticateJWT, async (req, res) => {
    try {
        const userId = (req.user as any)._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const requests = user.wallet.transactions.filter(
            (t: any) => t.status === 'refund_pending' || t.status === 'refunded' || t.status === 'refund_denied'
        );

        res.json(requests);
    } catch (error) {
        console.error('Failed to get refund requests:', error);
        res.status(500).json({ error: 'Failed to fetch refund requests' });
    }
});

export default router;
