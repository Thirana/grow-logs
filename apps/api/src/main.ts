import './instrument.js';
import { NestFactory } from '@nestjs/core';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { setupSwagger } from './swagger.setup.js';
import { appConfig } from './config/index.js';

interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  configureApp(app);

  const cfg = app.get<AppConfig>(appConfig.KEY);

  setupSwagger(app);

  await app.listen(cfg.port);

  const nestLogger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  nestLogger.log?.(`Application running on http://localhost:${cfg.port}`);
}

bootstrap().catch((err: unknown) => {
  console.error('Bootstrap failed', err);
  process.exit(1);
});
