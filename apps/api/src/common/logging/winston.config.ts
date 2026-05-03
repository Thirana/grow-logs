import { format, transports, type LoggerOptions } from 'winston';

const { combine, timestamp, errors, json, printf, colorize } = format;

export function buildWinstonConfig(
  level: string,
  logFormat: 'pretty' | 'json',
  serviceName: string,
): LoggerOptions {
  const jsonFormat = combine(timestamp(), errors({ stack: true }), json());

  const prettyFormat = combine(
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp: ts, level: lvl, message, stack, ...meta }) => {
      const fields = [
        meta['event'] as string | undefined,
        meta['requestId'] as string | undefined,
        meta['method'] as string | undefined,
        meta['path'] as string | undefined,
        meta['statusCode'] != null
          ? String(meta['statusCode'] as number)
          : undefined,
        meta['durationMs'] != null
          ? `${String(meta['durationMs'] as number)}ms`
          : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      const base = `${String(ts)} [${String(lvl)}] ${String(message)}${fields ? ' ' + fields : ''}`;
      return typeof stack === 'string' ? `${base}\n${stack}` : base;
    }),
    colorize({ all: true }),
  );

  return {
    level,
    defaultMeta: { service: serviceName },
    format: logFormat === 'json' ? jsonFormat : prettyFormat,
    transports: [new transports.Console()],
  };
}
