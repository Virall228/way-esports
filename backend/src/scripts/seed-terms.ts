import mongoose from 'mongoose';
import TermsAndConditions from '../models/TermsAndConditions';
import { config } from '../config';

const initialTerms = {
    version: '1.0.0',
    title: 'WAY Esports - Terms & Conditions',
    content: `
# WAY Esports User Agreement

Welcome to WAY Esports. By using our platform, you agree to the following terms:

## 1. Participation
- Users must be at least 16 years old.
- Users are responsible for maintaining the security of their accounts.

## 2. Tournament Rules
- Fair play is mandatory. Use of cheats or third-party software is strictly prohibited.
- Decisions made by tournament administrators are final.

## 3. Payments and Refunds
- Subscriptions provide access to premium tournaments and features.
- Refunds can be requested within 24 hours of purchase if no tournament benefits have been consumed.

## 4. Privacy
- We value your privacy and handle data according to our Privacy Policy.
  `,
    effectiveDate: new Date(),
    isActive: true
};

async function seedTerms() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        // Check if version 1.0.0 already exists
        const existing = await TermsAndConditions.findOne({ version: '1.0.0' });
        if (existing) {
            console.log('Terms version 1.0.0 already exists. Skipping...');
        } else {
            await new TermsAndConditions(initialTerms).save();
            console.log('Successfully seeded initial Terms and Conditions (v1.0.0)');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedTerms();
