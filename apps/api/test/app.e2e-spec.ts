import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { expectStandardErrorShape } from './support/http-response.helpers.js';

interface LivenessBody {
  data: { status: string; uptime: number };
}

interface ReadinessBody {
  data: { status: string; db: string };
}

describe('App (e2e)', () => {
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

  it('GET /api/v1/health/live returns 200 with status ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200);

    const body = res.body as LivenessBody;
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('status', 'ok');
    expect(typeof body.data.uptime).toBe('number');
  });

  it('GET /api/v1/health/ready returns 200 when DB is reachable', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200);

    const body = res.body as ReadinessBody;
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('status', 'ok');
    expect(body.data).toHaveProperty('db', 'reachable');
  });

  it('unknown route returns 404 with standard error shape', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/unknown-route')
      .expect(404);

    expectStandardErrorShape(res.body as Record<string, unknown>);
  });
});
