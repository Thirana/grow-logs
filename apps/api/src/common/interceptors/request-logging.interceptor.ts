import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { RequestWithId } from '../http/request.types.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request & Partial<RequestWithId>>();
    const res = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(req, res.statusCode, startTime);
        },
        error: () => {
          this.logRequest(req, res.statusCode, startTime);
        },
      }),
    );
  }

  private logRequest(
    req: Request & Partial<RequestWithId>,
    statusCode: number,
    startTime: number,
  ): void {
    const entry = {
      event: 'http.request',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      durationMs: Date.now() - startTime,
    };

    if (statusCode >= 500) {
      this.logger.error?.('http.request', entry);
    } else if (statusCode >= 400) {
      this.logger.warn?.('http.request', entry);
    } else {
      this.logger.log?.('http.request', entry);
    }
  }
}
