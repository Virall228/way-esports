#!/usr/bin/env ts-node

/**
 * Migration Runner Script
 * 
 * Usage:
 *   npm run migrate          # Run all migrations
 *   npm run migrate:drop     # Drop all custom indexes
 *   npm run migrate:stats    # Show index statistics
 */

import { program } from 'commander';
import mongoose from 'mongoose';
import config from '../config/config';
import { createIndexes, dropCustomIndexes, getIndexStats } from '../migrations/indexes';

program
  .name('migrate')
  .description('MongoDB migration runner')
  .version('1.0.0');

program
  .command('up')
  .description('Create all required indexes')
  .action(async () => {
    try {
      await mongoose.connect(config.database.url);
      console.log('🔗 Connected to MongoDB');
      
      await createIndexes();
      
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('down')
  .description('Drop all custom indexes (for testing)')
  .action(async () => {
    try {
      await mongoose.connect(config.database.url);
      console.log('🔗 Connected to MongoDB');
      
      await dropCustomIndexes();
      
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current index statistics')
  .action(async () => {
    try {
      await mongoose.connect(config.database.url);
      console.log('🔗 Connected to MongoDB');
      
      await getIndexStats();
      
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  });

program.parse();
