// eslint-disable-next-line max-classes-per-file
import { Module, Provider } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JaegerMiddleware, JaegerModule, SpanService, TRACER_OPTIONS, TracerService } from '@newtral/nestjs-jaeger';
import { getTestingModule, testTracerConfiguration } from '@tests/_helpers/module';
import { expect } from 'chai';
import faker from 'faker';

describe('JaegerModule', () => {
  it('should export JaegerInterceptor', async () => {
    const jaegerModule = await getTestingModule();

    const jaegerInterceptor = jaegerModule.get(JaegerMiddleware);
    expect(jaegerInterceptor).to.be.instanceOf(JaegerMiddleware);
  });

  it('should export SpanService', async () => {
    const jaegerModule = await getTestingModule();

    const spanService = await jaegerModule.resolve(SpanService);
    expect(spanService).to.be.instanceOf(SpanService);
  });

  it('should export TRACER_OPTIONS', async () => {
    const jaegerModule = await getTestingModule();

    const tracerOptions = jaegerModule.get(TRACER_OPTIONS);
    expect(tracerOptions).to.be.deep.equal(testTracerConfiguration);
  });

  it('should export TracerService', async () => {
    const jaegerModule = await getTestingModule();

    const tracerService = jaegerModule.get(TracerService);
    expect(tracerService).to.be.instanceOf(TracerService);
  });

  it('should be loaded using forRoot', async () => {
    const initialOptions = { config: { serviceName: faker.lorem.sentence(), disable: true } };
    const module = JaegerModule.forRoot(initialOptions);
    const tracerModule = await Test.createTestingModule({ imports: [module], exports: [module] }).compile();

    const options = tracerModule.get(TRACER_OPTIONS);
    expect(options).to.be.deep.equal(initialOptions);
  });

  it('should be load using forRootAsync (useFactory)', async () => {
    const serviceName = faker.lorem.sentence();

    const optionsProviders: Provider[] = [{ provide: 'serviceName', useValue: serviceName }];

    @Module({
      providers: optionsProviders,
      exports: optionsProviders
    })
    class OptionsModule {}

    const module = JaegerModule.forRootAsync({
      imports: [OptionsModule],
      useFactory: name => ({ config: { serviceName: name, disable: true } }),
      inject: ['serviceName']
    });
    const tracerModule = await Test.createTestingModule({ imports: [module], exports: [module] }).compile();

    const options = tracerModule.get(TRACER_OPTIONS);
    expect(options).to.be.deep.equal({ config: { serviceName, disable: true } });
  });

  it('should be load using forRootAsync (useExisting)', async () => {
    const serviceName = faker.lorem.sentence();

    const optionsProviders: Provider[] = [{ provide: 'options', useValue: { config: { serviceName, disable: true } } }];

    @Module({
      providers: optionsProviders,
      exports: optionsProviders
    })
    class OptionsModule {}

    const module = JaegerModule.forRootAsync({
      imports: [OptionsModule],
      useExisting: 'options'
    });
    const tracerModule = await Test.createTestingModule({ imports: [module], exports: [module] }).compile();

    const options = tracerModule.get(TRACER_OPTIONS);
    expect(options).to.be.deep.equal({ config: { serviceName, disable: true } });
  });
});
