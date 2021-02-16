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
