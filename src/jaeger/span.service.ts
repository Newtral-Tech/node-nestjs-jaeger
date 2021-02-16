import { Injectable, Scope } from '@nestjs/common';
import { Span, SpanOptions, Tags } from 'opentracing';
import { TracerService } from './tracer.service';

const error = Symbol('tracer.SPAN_ERROR');

@Injectable({ scope: Scope.REQUEST })
export class SpanService {
  private activeSpan: Span | undefined = undefined;

  constructor(private readonly tracerService: TracerService) {}

  /** Start a new span */
  startSpan(name: string, options?: SpanOptions): Span {
    return this.tracerService.getTracer().startSpan(name, options);
  }

  /** Start a new span and set it as the active span */
  startActiveSpan(name: string, options?: SpanOptions): Span {
    const span = this.startSpan(name, options);

    this.activeSpan = span;

    return span;
  }

  /** Finalizes the given span. If the span is the active span it is also unset */
  finishSpan(span: Span): void {
    span.finish();

    if (this.activeSpan === span) {
      this.activeSpan = undefined;
    }
  }

  /** Get the active span. If there is no active span it returns `undefined` */
  getActiveSpan(): Span | undefined {
    return this.activeSpan;
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
  return (span as any)[error] === true;
}

/**
 * Marks the span as error span.
 * Use this instead of `span.setTag('error', true)` because it only will not set the error tag more than once
 */
export function markAsErroredSpan(span: Span): void {
  if (isErroredSpan(span)) {
    return;
  }

  (span as any)[error] = true;
  span.setTag(Tags.ERROR, true);
}
