import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Tournament from '../src/models/Tournament';

const TELEGRAM_SDK_AUTH_TOKEN = 'eyJhcHBfbmFtZSI6IldBWUUiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL1dBWUVzcG9ydHNfYm90IiwiYXBwX2RvbWFpbiI6Imh0dHBzOi8vd2F5ZXNwb3J0cy1hcHAubmV0bGlmeS5hcHAifQ==!cdtiWsDWKPJbeLJVlU5ZxoMg8mtf0JmKBppjIop29mM=';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Tournaments API', () => {
  it('GET /api/tournaments -> 200 и массив', async () => {
    const res = await request(app)
      .get('/api/tournaments')
      .set('x-telegram-sdk-auth', TELEGRAM_SDK_AUTH_TOKEN)
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/tournaments -> 201 и создание', async () => {
    const payload = {
      name: 'Cup',
      game: 'CS2',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      prizePool: 1000,
      maxTeams: 8,
      format: 'single_elimination',
      type: 'team',
      description: 'Test',
      rules: 'Be fair',
      createdBy: new mongoose.Types.ObjectId()
    };

    const res = await request(app)
      .post('/api/tournaments')
      .set('x-telegram-sdk-auth', TELEGRAM_SDK_AUTH_TOKEN)
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('_id');

    const inDb = await Tournament.findById(res.body.data._id);
    expect(inDb).not.toBeNull();
  });
});
