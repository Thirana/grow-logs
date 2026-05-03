const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

export function deriveErrorCode(
  statusCode: number,
  errorName?: string,
  explicitCode?: string,
): string {
  if (explicitCode) {
    return explicitCode;
  }

  const mapped = STATUS_CODE_MAP[statusCode];
  if (mapped) {
    return mapped;
  }

  if (errorName) {
    return errorName
      .replace(/Exception$/, '')
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
  }

  return 'INTERNAL_ERROR';
}
