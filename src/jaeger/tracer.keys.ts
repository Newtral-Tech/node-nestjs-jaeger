import { Inject } from '@nestjs/common';

/**
 * Injection token for the tracer options
 *
 * @example
 *
 * ```ts
 * @Injectable()
 * class MyProvider {
 *   constructor(@Inject(TRACER_OPTIONS) private readonly config: TracerConfiguration) {}
 * }
 * ```
 */
export const TRACER_OPTIONS = Symbol('tracer.TRACER_OPTIONS');

export function InjectTracerOptions(): ParameterDecorator {
  return Inject(TRACER_OPTIONS);
}
