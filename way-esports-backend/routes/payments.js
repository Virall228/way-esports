const router = require('express').Router();
const { TonClient } = require('@ton/ton');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

// Initialize TON client
const client = new TonClient({
    endpoint: process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC'
});

// Generate payment address for tournament entry
router.post('/tournament-entry/:tournamentId', async (req, res) => {
    try {
        const { telegramId } = req.body;
        const tournament = await Tournament.findById(req.params.tournamentId);
        const user = await User.findOne({ telegramId });

        if (!tournament || !user) {
            return res.status(404).json('Tournament or User not found');
        }

        // Generate unique payment address for this transaction
        const paymentAddress = await client.generatePaymentAddress();

        // Store payment info in user's wallet
        user.wallet.pendingPayments = user.wallet.pendingPayments || [];
        user.wallet.pendingPayments.push({
            type: 'tournament_entry',
            tournamentId: tournament._id,
            amount: tournament.entryFee,
            address: paymentAddress,
            status: 'pending',
            createdAt: new Date()
        });

        await user.save();

        res.json({
            paymentAddress,
            amount: tournament.entryFee,
            message: `Tournament entry fee for ${tournament.name}`
        });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Verify payment status
router.get('/verify/:paymentId', async (req, res) => {
    try {
        const payment = await client.getTransaction(req.params.paymentId);
        res.json(payment);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get user's payment history
router.get('/history/:telegramId', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) {
            return res.status(404).json('User not found');
        }

        const payments = user.wallet.pendingPayments || [];
        res.json(payments);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Withdraw prize money
router.post('/withdraw', async (req, res) => {
    try {
        const { telegramId, amount, destinationAddress } = req.body;
        const user = await User.findOne({ telegramId });

        if (!user) {
            return res.status(404).json('User not found');
        }

        if (user.wallet.balance < amount) {
            return res.status(400).json('Insufficient balance');
        }

        // Process withdrawal through TON
        const withdrawal = await client.sendTransaction({
            to: destinationAddress,
            amount: amount,
            message: 'Prize money withdrawal'
        });

        // Update user's balance
        user.wallet.balance -= amount;
        user.wallet.transactions = user.wallet.transactions || [];
        user.wallet.transactions.push({
            type: 'withdrawal',
            amount: amount,
            address: destinationAddress,
            txHash: withdrawal.txHash,
            timestamp: new Date()
        });

        await user.save();

        res.json({
            message: 'Withdrawal processed successfully',
            txHash: withdrawal.txHash
        });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

module.exports = router; 