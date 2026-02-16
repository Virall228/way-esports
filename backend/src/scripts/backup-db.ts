import { connectDB, disconnectDB } from '../config/db';
import { runJsonBackup } from '../services/backupService';

const run = async () => {
  try {
    await connectDB();
    const { snapshotDir, manifest } = await runJsonBackup();
    manifest.collections.forEach((entry) => {
      console.log(`[backup] ${entry.collection}: ${entry.rows} rows`);
    });
    console.log(`[backup] Completed: ${snapshotDir}`);

    process.exitCode = 0;
  } catch (error) {
    console.error('[backup] Failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

run();
