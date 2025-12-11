import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import { connectDB, disconnectDB } from '../src/config/db';
import Team from '../src/models/Team';
import Tournament from '../src/models/Tournament';
import Match from '../src/models/Match';

dotenvConfig();

type ImportType = 'teams' | 'tournaments' | 'matches';

interface Args {
  file: string;
  type: ImportType;
}

function parseArgs(): Args {
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  const typeArg = process.argv.find((a) => a.startsWith('--type='));
  if (!fileArg || !typeArg) {
    throw new Error('Usage: node -r ts-node/register scripts/importData.ts --type=teams|tournaments|matches --file=./data.json');
  }
  const file = fileArg.split('=')[1];
  const type = typeArg.split('=')[1] as ImportType;
  if (!file || !type) {
    throw new Error('Both --file and --type are required');
  }
  return { file, type };
}

function parseCSV(content: string): any[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return headers.reduce((obj: any, h, idx) => {
      obj[h] = values[idx];
      return obj;
    }, {});
  });
}

async function main() {
  const { file, type } = parseArgs();
  const filePath = path.resolve(process.cwd(), file);
  const raw = fs.readFileSync(filePath, 'utf-8');

  let items: any[];
  if (filePath.endsWith('.json')) {
    items = JSON.parse(raw);
  } else if (filePath.endsWith('.csv')) {
    items = parseCSV(raw);
  } else {
    throw new Error('Unsupported file format. Use .json or .csv');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('File must contain a non-empty array of items');
  }

  await connectDB();

  switch (type) {
    case 'teams': {
      const res = await Team.insertMany(items, { ordered: false });
      console.log(`Inserted teams: ${res.length}`);
      break;
    }
    case 'tournaments': {
      const res = await Tournament.insertMany(items, { ordered: false });
      console.log(`Inserted tournaments: ${res.length}`);
      break;
    }
    case 'matches': {
      const res = await Match.insertMany(items, { ordered: false });
      console.log(`Inserted matches: ${res.length}`);
      break;
    }
    default:
      throw new Error('Unknown import type');
  }
}

main()
  .then(() => disconnectDB())
  .catch((err) => {
    console.error(err);
    void disconnectDB().finally(() => process.exit(1));
  });


