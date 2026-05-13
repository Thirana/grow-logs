import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { REQUEST_ID_HEADER } from '../src/common/http/request-id.constants.js';

describe('Request ID propagation (e2e)', () => {
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

  it('echoes x-request-id back on a successful response', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set(REQUEST_ID_HEADER, 'test-id-123')
      .expect(200);

    expect(res.headers[REQUEST_ID_HEADER]).toBe('test-id-123');
  });

  it('echoes x-request-id back on an error response header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/unknown-route')
      .set(REQUEST_ID_HEADER, 'test-id-456')
      .expect(404);

    expect(res.headers[REQUEST_ID_HEADER]).toBe('test-id-456');
  });

  it('includes requestId in the error body matching the sent header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/unknown-route')
      .set(REQUEST_ID_HEADER, 'test-id-456')
      .expect(404);

    const body = res.body as Record<string, unknown>;
    expect(body['requestId']).toBe('test-id-456');
  });
});
