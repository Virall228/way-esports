const mongoose = require('mongoose');
const TermsAndConditions = require('../src/models/TermsAndConditions').default;

async function seedTermsAndConditions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports');
    console.log('Connected to MongoDB');

    // Check if terms already exist
    const existingTerms = await TermsAndConditions.findOne({ version: '1.0' });
    
    if (existingTerms) {
      console.log('Terms and conditions already exist');
      process.exit(0);
    }

    // Create initial terms and conditions
    const terms = await TermsAndConditions.create({
      version: '1.0',
      title: 'WAY Esports Terms of Service',
      content: `
# WAY Esports Terms of Service

## 1. Acceptance of Terms

By accessing and using WAY Esports, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily download one copy of the materials on WAY Esports for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

- modify or copy the materials
- use the materials for any commercial purpose or for any public display

## 3. Tournament Participation

### 3.1 Eligibility
- You must be at least 13 years of age to participate
- You must have a valid account in good standing
- You must comply with all game-specific rules and regulations

### 3.2 Registration
- Tournament registration requires either an active subscription or valid free entry
- Registration is subject to availability and may be closed at any time
- False or misleading information may result in disqualification

### 3.3 Prize Distribution
- Prizes are awarded based on tournament performance
- Prize distribution may take up to 48 hours after tournament completion
- WAY Esports reserves the right to modify prize structures

## 4. Subscription Services

### 4.1 Billing
- Subscription fees are charged monthly
- No refunds for partial months
- Subscription auto-renews unless cancelled

### 4.2 Cancellation
- You may cancel at any time
- Access continues until end of billing period
- No refunds for unused time

## 5. Referral Program

### 5.1 Participation
- Referral bonuses are awarded for successful referrals
- A referral is considered successful after the referred user participates in their first tournament
- WAY Esports reserves the right to modify referral terms

### 5.2 Fraud Prevention
- Only one account per person is permitted
- Self-referrals are strictly prohibited
- Fraudulent activity will result in account suspension

## 6. Prohibited Activities

You may not:
- Use automated scripts or bots
- Attempt to gain unauthorized access
- Harass other users
- Exploit bugs or glitches
- Share account credentials

## 7. Privacy

Your privacy is important to us. Please review our Privacy Policy for details on how we collect, use, and protect your information.

## 8. Disclaimers

The materials on WAY Esports are provided on an 'as is' basis. WAY Esports makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## 9. Limitation of Liability

In no event shall WAY Esports or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on WAY Esports.

## 10. Changes to Terms

WAY Esports may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.

## 11. Governing Law

These terms and conditions are governed by and construed in accordance with the laws of [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.

---

**Last Updated:** ${new Date().toLocaleDateString()}
**Effective Date:** ${new Date().toLocaleDateString()}
      `.trim(),
      effectiveDate: new Date(),
      isActive: true
    });

    console.log('Terms and conditions created successfully');
    console.log(`Version: ${terms.version}`);
    console.log(`Title: ${terms.title}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed terms and conditions:', error);
    process.exit(1);
  }
}

seedTermsAndConditions();
