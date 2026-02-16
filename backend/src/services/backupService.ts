import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import mongoose from 'mongoose';

const ensureDir = async (dirPath: string) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const formatTimestamp = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}_${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
};

const getDb = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB is not connected');
  }
  return db;
};

const gzipFile = async (sourcePath: string) => {
  const destinationPath = `${sourcePath}.gz`;
  await pipeline(
    fs.createReadStream(sourcePath),
    zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED }),
    fs.createWriteStream(destinationPath)
  );
  await fs.promises.unlink(sourcePath);
  return destinationPath;
};

const writeCollectionDump = async (collectionName: string, outputDir: string) => {
  const filePath = path.join(outputDir, `${collectionName}.ndjson`);
  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
  const collection = getDb().collection(collectionName);
  const cursor = collection.find({}, { batchSize: 500 });
  let rows = 0;

  for await (const doc of cursor) {
    stream.write(`${JSON.stringify(doc)}\n`);
    rows += 1;
  }

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on('error', reject);
  });

  const gzPath = await gzipFile(filePath);
  return { collection: collectionName, rows, file: path.basename(gzPath) };
};

const cleanupOldSnapshots = async (backupRoot: string, retentionDays: number) => {
  if (retentionDays <= 0) return;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const entries = await fs.promises.readdir(backupRoot, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory() || !entry.name.startsWith('snapshot_')) return;
      const fullPath = path.join(backupRoot, entry.name);
      const stat = await fs.promises.stat(fullPath);
      if (stat.mtimeMs < cutoff) {
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      }
    })
  );
};

export interface BackupManifest {
  createdAt: string;
  database: string;
  collections: Array<{ collection: string; rows: number; file: string }>;
}

export const runJsonBackup = async () => {
  const backupRoot = process.env.DB_BACKUP_DIR || path.join(process.cwd(), 'backups');
  const retentionDays = Number(process.env.DB_BACKUP_RETENTION_DAYS || 7);
  const snapshotName = `snapshot_${formatTimestamp(new Date())}`;
  const snapshotDir = path.join(backupRoot, snapshotName);
  const db = getDb();

  await ensureDir(snapshotDir);

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const dumps: Array<{ collection: string; rows: number; file: string }> = [];

  for (const item of collections) {
    if (!item.name || item.name.startsWith('system.')) continue;
    // eslint-disable-next-line no-await-in-loop
    const result = await writeCollectionDump(item.name, snapshotDir);
    dumps.push(result);
  }

  const manifest: BackupManifest = {
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    collections: dumps
  };

  await fs.promises.writeFile(
    path.join(snapshotDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  await cleanupOldSnapshots(backupRoot, retentionDays);

  return {
    snapshotDir,
    manifest
  };
};

export const listJsonBackups = async () => {
  const backupRoot = process.env.DB_BACKUP_DIR || path.join(process.cwd(), 'backups');
  await ensureDir(backupRoot);
  const entries = await fs.promises.readdir(backupRoot, { withFileTypes: true });
  const snapshots = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('snapshot_'))
      .map(async (entry) => {
        const fullPath = path.join(backupRoot, entry.name);
        const stat = await fs.promises.stat(fullPath);
        const manifestPath = path.join(fullPath, 'manifest.json');
        let collections = 0;
        if (fs.existsSync(manifestPath)) {
          try {
            const text = await fs.promises.readFile(manifestPath, 'utf8');
            const parsed = JSON.parse(text);
            collections = Array.isArray(parsed.collections) ? parsed.collections.length : 0;
          } catch {
            collections = 0;
          }
        }

        return {
          id: entry.name,
          path: fullPath,
          createdAt: stat.birthtime.toISOString(),
          updatedAt: stat.mtime.toISOString(),
          collections
        };
      })
  );

  return snapshots.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

