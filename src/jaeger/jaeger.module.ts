import { DynamicModule, Global, ModuleMetadata, Provider } from '@nestjs/common';
import { TracingConfig, TracingOptions } from 'jaeger-client';
import { JaegerMiddleware } from './jaeger.middleware';
import { RequestSpanService } from './request-span.service';
import { RequestContext } from './request-context';
import { SpanService } from './span.service';
import { TRACER_OPTIONS } from './tracer.keys';
import { TracerService } from './tracer.service';

@Global()
export class JaegerModule {
  static forRootAsync(options: TracerModuleAsyncOptions): DynamicModule {
    const imports = [...(options.imports ?? [])];
    const providers = getProviders();

    if ('useExisting' in options) {
      providers.push({
        provide: TRACER_OPTIONS,
        useExisting: options.useExisting
      });
    } else {
      providers.push({
        provide: TRACER_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject
      });
    }

    return {
      global: true,
      module: JaegerModule,
      providers,
      imports,
      exports: [...providers, TRACER_OPTIONS]
    };
  }

  static forRoot(options: TracerConfiguration): DynamicModule {
    const providers = getProviders();

    return {
      global: true,
      module: JaegerModule,
      providers: [...providers, { provide: TRACER_OPTIONS, useValue: { ...options } }],
      exports: [...providers, TRACER_OPTIONS]
    };
  }
}

export interface TracerConfiguration {
  config?: TracingConfig;
  options?: TracingOptions;
}

export type TracerModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  (
    | { useExisting: Provider | string | symbol }
    | { useFactory: (...args: any[]) => Promise<TracerConfiguration> | TracerConfiguration; inject?: any[] }
  );

function getProviders(): Provider[] {
  return [JaegerMiddleware, SpanService, TracerService, RequestContext, RequestSpanService];
}
