import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { deriveErrorCode } from '../http/error-code.util.js';
import type { RequestWithId } from '../http/request.types.js';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  errors: string[];
  errorCode: string;
  requestId: string | undefined;
  path: string;
  timestamp: string;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & Partial<RequestWithId>>();
    const res = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const body: ErrorResponseBody = this.buildResponseBody(
      exception,
      statusCode,
      req,
    );

    if (statusCode >= 500) {
      Sentry.captureException(exception);
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error?.('Unhandled exception', { ...body, stack });
    } else {
      this.logger.warn?.('Request error', body);
    }

    res.status(statusCode).json(body);
  }

  private buildResponseBody(
    exception: unknown,
    statusCode: number,
    req: Request & Partial<RequestWithId>,
  ): ErrorResponseBody {
    let message = 'Internal server error';
    let errors: string[] = [];
    let explicitCode: string | undefined;

    if (exception instanceof HttpException) {
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        message = raw;
      } else if (typeof raw === 'object' && raw !== null) {
        const body = raw as Record<string, unknown>;

        const rawMessage = body['message'];
        if (typeof rawMessage === 'string') {
          message = rawMessage;
        } else if (Array.isArray(rawMessage)) {
          message = 'Validation failed';
          errors = rawMessage as string[];
        }

        const rawErrors = body['errors'];
        if (Array.isArray(rawErrors)) {
          errors = rawErrors as string[];
        }

        const rawCode = body['errorCode'];
        if (typeof rawCode === 'string') {
          explicitCode = rawCode;
        }
      }
    }

    const errorName =
      exception instanceof Error ? exception.constructor.name : undefined;

    return {
      statusCode,
      message,
      errors,
      errorCode: deriveErrorCode(statusCode, errorName, explicitCode),
      requestId: req.requestId,
      path: req.url,
      timestamp: new Date().toISOString(),
    };
  }
}
