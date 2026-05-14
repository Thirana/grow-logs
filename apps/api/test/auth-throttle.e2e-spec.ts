import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { expectStandardErrorShape } from './support/http-response.helpers.js';

describe('Auth throttling (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 on the 6th request within one minute and uses the standard error envelope', async () => {
    const body = {
      email: 'throttle-test@example.com',
      password: 'WrongPass1!',
    };

    // First 5 requests consume the limit — each returns 401 (wrong credentials), not 429
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(body);
      expect(res.status).not.toBe(429);
    }

    // 6th request exceeds the limit
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(body)
      .expect(429);

    const body = res.body as Record<string, unknown>;
    expect(body.statusCode).toBe(429);
    expectStandardErrorShape(body);
  });
});
