import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface StandardEnvelope {
  data: unknown;
  meta: Record<string, unknown>;
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardEnvelope> {
    return next.handle().pipe(
      map((value: unknown): StandardEnvelope => {
        if (value == null) {
          return { data: null, meta: {} };
        }

        if (
          typeof value === 'object' &&
          'data' in (value as Record<string, unknown>)
        ) {
          return value as StandardEnvelope;
        }

        return { data: value, meta: {} };
      }),
    );
  }
}
