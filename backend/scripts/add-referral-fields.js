const mongoose = require('mongoose');

async function addReferralFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports');
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Update all users to add missing fields
    const result = await usersCollection.updateMany(
      {
        isSubscribed: { $exists: false }
      },
      {
        $set: {
          isSubscribed: false,
          freeEntriesCount: 0,
          referralCode: null,
          referredBy: null,
          subscriptionExpiresAt: null
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);

    // Create referral settings if not exists
    const referralSettingsCollection = db.collection('referralsettings');
    await referralSettingsCollection.updateOne(
      {},
      {
        $setOnInsert: {
          referralBonusThreshold: 3,
          refereeBonus: 1,
          referrerBonus: 1,
          subscriptionPrice: 9.99,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('Referral settings created/updated');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addReferralFields();
