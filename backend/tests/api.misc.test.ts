import request from 'supertest';
import app from '../src/app';

const TELEGRAM_SDK_AUTH_TOKEN =
  'eyJhcHBfbmFtZSI6IldBWUUiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL1dBWUVzcG9ydHNfYm90IiwiYXBwX2RvbWFpbiI6Imh0dHBzOi8vd2F5ZXNwb3J0cy1hcHAubmV0bGlmeS5hcHAifQ==!cdtiWsDWKPJbeLJVlU5ZxoMg8mtf0JmKBppjIop29mM=';

describe('Swagger and health', () => {
  it('GET /api-docs -> < 500 (Swagger UI page)', async () => {
    const res = await request(app)
      .get('/api-docs')
      .set('x-telegram-sdk-auth', TELEGRAM_SDK_AUTH_TOKEN);
    expect(res.status).toBeLessThan(500);
  });
});
