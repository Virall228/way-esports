# MongoDB Index Migrations

This directory contains migration scripts for MongoDB indexes, including TTL (time-to-live) indexes for automatic cleanup of temporary data.

## Overview

The migration system ensures:
- **TTL indexes** for sessions and OTPs (automatic cleanup after expiration)
- **Unique indexes** for data integrity (telegramId, email, team tags, etc.)
- **Compound indexes** for optimal query performance
- **Sparse indexes** for optional unique fields

## Available Commands

```bash
# Create all required indexes
npm run migrate

# Drop all custom indexes (for testing/reset)
npm run migrate:down

# Show current index statistics
npm run migrate:status
```

## Index Details

### Sessions Collection
- `tokenHash` - Unique index for session lookup
- `expiresAt` - TTL index (expireAfterSeconds: 0) for automatic cleanup
- `user` - Index for user session queries

### Email OTP Collection
- `email` - Index for email-based OTP lookup
- `expiresAt` - TTL index (expireAfterSeconds: 0) for automatic cleanup
- `email, expiresAt` - Compound index for efficient cleanup

### Users Collection
- `telegramId` - Unique sparse index for Telegram auth
- `email` - Unique sparse index for email auth
- `username` - Unique index for user lookup

### Teams Collection
- `tag` - Unique index for team identification
- `game` - Index for game-based filtering
- `captain` - Index for captain lookup

### Tournaments Collection
- `status` - Index for tournament filtering
- `startDate` - Index for date-based sorting
- `game` - Index for game-based filtering
- `status, startDate` - Compound index for active tournaments

### Matches Collection
- `tournament` - Index for tournament match queries
- `status` - Index for match status filtering
- `startTime` - Index for chronological ordering
- `tournament, status` - Compound index for tournament schedules

### Achievements Collection
- `key` - Unique index for achievement identification
- `isActive` - Index for active achievement filtering

### News Collection
- `publishDate` - Index for chronological ordering
- `category` - Index for category filtering
- `status` - Index for published/unpublished filtering

### Rewards Collection
- `isActive` - Index for active reward filtering
- `type` - Index for reward type filtering

### Player Rewards Collection
- `user` - Index for user reward lookup
- `reward` - Index for reward-specific queries
- `claimedAt` - Index for claimed reward tracking

### Wallet Collection
- `user` - Unique index for user wallet lookup

## TTL Behavior

- **Sessions**: Automatically deleted when `expiresAt` is reached (30 days by default)
- **Email OTPs**: Automatically deleted when `expiresAt` is reached (15 minutes by default)
- TTL indexes are created with `expireAfterSeconds: 0` for immediate cleanup

## Running Migrations

### Development
```bash
# Create indexes
npm run migrate

# Check status
npm run migrate:status

# Reset (if needed)
npm run migrate:down
```

### Production
```bash
# Ensure indexes exist before starting the app
npm run migrate

# Start the application
npm start
```

## Safety Notes

- The migration script is **idempotent** - running it multiple times is safe
- `migrate:down` only removes custom indexes, never the default `_id` index
- TTL indexes may take up to 60 seconds to clean up expired documents
- Always backup your database before running `migrate:down` in production

## Troubleshooting

### Index Already Exists
The migration script handles existing indexes gracefully. If an index already exists, it will be verified and skipped if correct.

### Permission Errors
Ensure your MongoDB user has `indexCreate` and `indexDrop` permissions:
```javascript
// In MongoDB shell
db.grantRolesToUser("yourUser", ["readWrite", "indexAdmin"])
```

### TTL Not Working
- Check that the `expiresAt` field is a `Date` type
- Verify the TTL index exists with `npm run migrate:status`
- Remember MongoDB runs TTL cleanup every 60 seconds

## Performance Impact

- Indexes are built in the background when possible
- Large collections may take several minutes to index
- Monitor your database during initial migration
- Consider running during low-traffic periods for production

## Model Updates

When adding new models or fields that need indexing:

1. Update the corresponding model file with `schema.index()` calls
2. Add the model to the `createIndexes()` function in `migrations/indexes.ts`
3. Run `npm run migrate` to apply the new indexes

Example:
```typescript
// In your model file
newSchema.index({ newField: 1 });

// In migrations/indexes.ts
await NewModel.createIndexes();
```
