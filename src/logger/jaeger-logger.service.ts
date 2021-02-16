import { Inject, Injectable } from '@nestjs/common';
import { LevelWithSilent, Logger, LOGGER_LOG_LEVEL, LOGGER_PRETTY_PRINT, LoggerService } from '@newtral/nestjs-logger';
import { SpanService } from '../jaeger/span.service';
import { SpanLogger } from './span-logger';

@Injectable()
export class JaegerLoggerService {
  private readonly loggerService = new LoggerService(this.level, this.prettyPrint);

  constructor(
    @Inject(LOGGER_LOG_LEVEL) private readonly level: LevelWithSilent,
    @Inject(LOGGER_PRETTY_PRINT) private readonly prettyPrint: boolean = true,
    private readonly spanService: SpanService
  ) {}

  /**
   * Create a new logger
   * @param moduleOrName - NodeJS module or name for the logger. When a module is given the name will be the module filename
   * @param level - Log level. By default the same level as the logger service instance but it could be overridden
   */
  getLogger(moduleOrName: NodeJS.Module | string, level = this.level): Logger {
    const logger = this.loggerService.getLogger(moduleOrName, level);

    // If the level is not enabled we can return a regular logger
    if (this.isLevelEnabled(level)) {
      return new SpanLogger(logger, () => this.spanService.getActiveSpan());
    }

    return logger;
  }

  private isLevelEnabled(level: LevelWithSilent) {
    return level !== 'silent' && levels[this.level] >= levels[level];
  }
}

const levels: { [K in LevelWithSilent]: number } = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
  silent: 0
};
