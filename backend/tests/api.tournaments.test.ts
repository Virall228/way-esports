import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';

const TELEGRAM_SDK_AUTH_TOKEN =
  'eyJhcHBfbmFtZSI6IldBWUUiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL1dBWUVzcG9ydHNfYm90IiwiYXBwX2RvbWFpbiI6Imh0dHBzOi8vd2F5ZXNwb3J0cy1hcHAubmV0bGlmeS5hcHAifQ==!cdtiWsDWKPJbeLJVlU5ZxoMg8mtf0JmKBppjIop29mM=';

describe('Tournaments API', () => {
  it('GET /api/tournaments -> 200 and list shape', async () => {
    const res = await request(app)
      .get('/api/tournaments')
      .set('x-telegram-sdk-auth', TELEGRAM_SDK_AUTH_TOKEN)
      .expect(200);

    expect(Array.isArray(res.body.tournaments)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  it('POST /api/tournaments -> 401 without admin auth', async () => {
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
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });
});
