import { registerAs } from '@nestjs/config';

export const loggingConfig = registerAs('logging', () => ({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: process.env['LOG_FORMAT'] as 'pretty' | 'json',
}));
