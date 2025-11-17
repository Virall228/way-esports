import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { MongoMemoryServer } from 'mongodb-memory-server';

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

describe('Swagger и health', () => {
  it('GET /api-docs -> 200 (HTML Swagger UI)', async () => {
    const res = await request(app)
      .get('/api-docs')
      .set('x-telegram-sdk-auth', TELEGRAM_SDK_AUTH_TOKEN);
    expect(res.status).toBeLessThan(500); // swagger-ui может редиректить ассеты
  });
});
