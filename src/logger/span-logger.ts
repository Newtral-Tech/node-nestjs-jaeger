import { Logger } from '@newtral/nestjs-logger';
import { Span } from 'opentracing';
import format from 'quick-format-unescaped';
import { markAsErroredSpan } from '../jaeger/span.service';

export class SpanLogger implements Logger {
  constructor(private readonly logger: Logger, private readonly getSpan: () => Span | undefined) {}

  fatal(msg: string, ...args: any[]): void;
  fatal(obj: object, msg?: string, ...args: any[]): void;
  fatal(msg: string | object, ...args: any[]): void {
    this.log('fatal', msg, ...args);
  }

  error(msg: string, ...args: any[]): void;
  error(obj: object, msg?: string, ...args: any[]): void;
  error(msg: string | object, ...args: any[]): void {
    this.log('error', msg, ...args);
  }

  warn(msg: string, ...args: any[]): void;
  warn(obj: object, msg?: string, ...args: any[]): void;
  warn(msg: string | object, ...args: any[]): void {
    this.log('warn', msg, ...args);
  }

  info(msg: string, ...args: any[]): void;
  info(obj: object, msg?: string, ...args: any[]): void;
  info(msg: string | object, ...args: any[]): void {
    this.log('info', msg, ...args);
  }

  debug(msg: string, ...args: any[]): void;
  debug(obj: object, msg?: string, ...args: any[]): void;
  debug(msg: string | object, ...args: any[]): void {
    this.log('debug', msg, ...args);
  }

  log(level: keyof Logger, message: string | object, ...args: any[]): void {
    this.logger[level](message as any, ...args);

    this.logToSpan(level, message, args);
  }

  private logToSpan(level: keyof Logger, message: string | object, ...args: unknown[]) {
    const span = this.getSpan();

    if (!span) {
      return;
    }

    const isError = level === 'error' || level === 'fatal';

    if (isError) {
      markAsErroredSpan(span);
    }

    let meta = undefined;

    if (typeof message !== 'string') {
      meta = message;
      message = args[0] as string;
      args = args.slice(1);
    }

    const log: Record<string, unknown> = {
      event: isError ? 'error' : 'log',
      'log.level': level,
      message: format(message, args)
    };

    if (meta && Object.keys(meta).length > 0) {
      log.metadata = meta;
    }

    span.log(log);
  }
}
