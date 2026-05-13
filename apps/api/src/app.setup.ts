import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { appConfig } from './config/index.js';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware.js';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor.js';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor.js';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';

interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
}

export function configureApp(app: INestApplication): void {
  const winstonLogger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(winstonLogger);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  app.use(helmet());

  const cfg = app.get<AppConfig>(appConfig.KEY);
  app.enableCors({ origin: cfg.frontendUrl, credentials: true });

  app.use(requestIdMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Validation failed',
          errors: errors.flatMap((e) => Object.values(e.constraints ?? {})),
          errorCode: 'VALIDATION_ERROR',
        });
      },
    }),
  );

  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(winstonLogger),
    new ResponseTransformInterceptor(),
  );

  app.useGlobalFilters(new AppExceptionFilter(winstonLogger));

  app.enableShutdownHooks();
}
