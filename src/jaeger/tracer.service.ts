import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { initTracer, JaegerTracer } from 'jaeger-client';
import { TracerConfiguration } from './jaeger.module';
import { TracerInitializationError } from './tracer-initialization.error';
import { TRACER_OPTIONS } from './tracer.keys';

@Injectable()
export class TracerService implements OnModuleInit, OnModuleDestroy {
  private tracer?: JaegerTracer;

  constructor(@Inject(TRACER_OPTIONS) private readonly configuration: TracerConfiguration) {}

  /**
   * Get the tracer. If the tracer is not yet initialized it throws a {@link TracerInitializationError}
   */
  getTracer(): JaegerTracer {
    if (!this.tracer) {
      throw new TracerInitializationError();
    }

    return this.tracer;
  }

  /** Initialize the Jaeger tracer. It can only by initialized once son multiple calls will have no effect */
  onModuleInit(): void {
    if (this.tracer) {
      return;
    }

    const { config = {}, options = {} } = this.configuration;

    this.tracer = initTracer(config, options);
  }

  /** Close the current tracer */
  async onModuleDestroy(): Promise<void> {
    // Also check the close function because it does not exist in the noop tracer
    // which is the tracer we get when config.disable is set to true
    await new Promise<void>(resolve => this.tracer?.close?.(resolve) ?? resolve());

    this.tracer = undefined;
  }
}
