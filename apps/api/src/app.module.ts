import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { SentryModule } from '@sentry/nestjs/setup';
import {
  validateEnv,
  appConfig,
  databaseConfig,
  loggingConfig,
} from './config/index.js';
import { buildWinstonConfig } from './common/logging/winston.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig, loggingConfig],
    }),
    WinstonModule.forRootAsync({
      useFactory: () => {
        const level = process.env['LOG_LEVEL'] ?? 'info';
        const nodeEnv = process.env['NODE_ENV'] ?? 'development';
        const format =
          (process.env['LOG_FORMAT'] as 'pretty' | 'json' | undefined) ??
          (nodeEnv === 'production' ? 'json' : 'pretty');
        return buildWinstonConfig(level, format, 'grow-logs');
      },
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
