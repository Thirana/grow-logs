import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  environment: process.env['NODE_ENV'],
  enabled:
    process.env['NODE_ENV'] === 'production' ||
    process.env['SENTRY_ENABLED'] === 'true',
  tracesSampleRate: 0.2,
  profileSessionSampleRate: 0.1,
  integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
});
