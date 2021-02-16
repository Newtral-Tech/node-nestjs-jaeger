export class TracerInitializationError extends Error {
  readonly name = this.constructor.name;

  constructor() {
    super('The tracer has not been initialized. You must call TracerService#onModuleInit() before accessing the tracer');
  }
}
