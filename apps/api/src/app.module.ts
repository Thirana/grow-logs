import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import {
  validateEnv,
  appConfig,
  databaseConfig,
  loggingConfig,
} from './config/index.js';
import { buildWinstonConfig } from './common/logging/winston.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';

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
    // Default limit (10 req/min) applies globally; AuthController overrides to 5 via @Throttle.
    ThrottlerModule.forRoot([{ name: 'auth', ttl: 60_000, limit: 10 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
