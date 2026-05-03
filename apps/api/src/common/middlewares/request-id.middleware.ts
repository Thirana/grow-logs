import type { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_HEADER } from '../http/request-id.constants.js';
import type { RequestWithId } from '../http/request.types.js';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const requestId =
    typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : crypto.randomUUID();

  (req as RequestWithId).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
