import { Injectable } from '@nestjs/common';
import { Span, SpanOptions, Tags } from 'opentracing';
import { RequestContext } from './request-context';
import { TracerService } from './tracer.service';

const SPAN_ERROR = Symbol('SPAN_ERROR');

export const ACTIVE_SPAN = Symbol('ACTIVE_SPAN');

@Injectable()
export class SpanService {
  constructor(private readonly tracerService: TracerService, private readonly requestContext: RequestContext) {}

  /** Start a new span */
  startSpan(name: string, options?: SpanOptions): Span {
    return this.tracerService.getTracer().startSpan(name, options);
  }

  /** Start a new span and set it as the active span */
  startActiveSpan(name: string, options?: SpanOptions): Span {
    const span = this.startSpan(name, options);

    this.requestContext.set(ACTIVE_SPAN, span);

    return span;
  }

  /** Finalizes the given span. If the span is the active span it is also unset */
  finishSpan(span: Span): void {
    span.finish();

    const activeSpan = this.getActiveSpan();

    if (span === activeSpan) {
      this.requestContext.delete(ACTIVE_SPAN);
    }
  }

  /** Get the active span. If there is no active span it returns `undefined` */
  getActiveSpan(): Span | undefined {
    return this.requestContext.get(ACTIVE_SPAN) as Span | undefined;
  }

  /**
   * Run the given handler for an span context.
   * When the handler is finished the span is also automatically finished
   */
  async withSpan<R>({ name, active = false, options, handler }: WithSpanOptions<R>): Promise<R> {
    const span = active ? this.startActiveSpan(name, options) : this.startSpan(name, options);

    try {
      return await handler(span);
    } finally {
      this.finishSpan(span);
    }
  }
}

export interface WithSpanOptions<R = unknown> {
  name: string;
  handler: (span: Span) => R;
  active?: boolean;
  options?: SpanOptions;
}

/** Check if the given span has been marked as error  */
export function isErroredSpan(span: Span): boolean {
  return (span as any)[SPAN_ERROR] === true;
}

/**
 * Marks the span as error span.
 * Use this instead of `span.setTag('error', true)` because it only will not set the error tag more than once
 */
export function markAsErroredSpan(span: Span): void {
  if (isErroredSpan(span)) {
    return;
  }

  (span as any)[SPAN_ERROR] = true;
  span.setTag(Tags.ERROR, true);
}
