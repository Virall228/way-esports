const router = require('express').Router();
const { TonClient } = require('@tonclient/core');
const { libWeb } = require('@tonclient/lib-web');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

TonClient.useBinaryLibrary(libWeb);

const client = new TonClient({
    network: {
        server_address: process.env.TON_NETWORK || 'https://toncenter.com/api/v2/jsonRPC'
    }
});

// Get user's balance
router.get('/balance', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.user.id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ balance: user.balance });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Process withdrawal
router.post('/withdraw', async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const user = await User.findOne({ telegramId: req.user.id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (parseFloat(amount) > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Process TON transfer
        const message = {
            address: req.body.walletAddress,
            amount: parseFloat(amount) * 1000000000, // Convert to nanotons
            bounce: false
        };

        // Create and process the transaction
        const transaction = new Transaction({
            userId: user._id,
            type: 'withdrawal',
            amount: parseFloat(amount),
            status: 'pending',
            walletAddress: req.body.walletAddress
        });

        // Update user balance
        user.balance -= parseFloat(amount);
        
        await Promise.all([
            transaction.save(),
            user.save()
        ]);

        // Send TON transfer message
        await client.processing.process_message({
            message_encode_params: {
                address: process.env.TON_WALLET_ADDRESS,
                abi: {
                    type: 'Contract',
                    value: require('../contracts/Wallet.abi.json')
                },
                call_set: {
                    function_name: 'sendTransaction',
                    input: message
                },
                signer: {
                    type: 'Keys',
                    keys: {
                        public: process.env.TON_WALLET_PUBLIC,
                        secret: process.env.TON_WALLET_SECRET
                    }
                }
            }
        });

        // Update transaction status
        transaction.status = 'completed';
        await transaction.save();

        res.json({ message: 'Withdrawal processed successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.user.id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const transactions = await Transaction.find({ userId: user._id })
            .sort('-createdAt')
            .limit(50);

        res.json(transactions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router; 