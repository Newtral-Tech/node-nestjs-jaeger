import { TracerInitializationError, TracerService } from '@newtral/nestjs-jaeger';
import { getTestingModule, testTracerConfiguration } from '@tests/_helpers/module';
import { expect } from 'chai';
import { Tracer } from 'opentracing';

describe('TracerService', () => {
  describe('#getTracer()', () => {
    it('should throw an error when accessing the tracer before initialization', async () => {
      const tracerService = new TracerService(testTracerConfiguration);

      expect(() => tracerService.getTracer()).to.throw(TracerInitializationError);
    });

    it('should initialize the tracer after the module is loaded', async () => {
      const tracerModule = await getTestingModule();

      await tracerModule.init();

      const tracer = tracerModule.get(TracerService).getTracer();

      expect(tracer).to.be.instanceOf(Tracer);

      await tracerModule.close();
    });

    it('should correctly get the tracer', async () => {
      const tracerService = new TracerService(testTracerConfiguration);

      tracerService.onModuleInit();

      const tracer = tracerService.getTracer();

      expect(tracer).to.be.instanceOf(Tracer);

      await tracerService.onModuleDestroy();
    });

    it('should not fail if #onModuleInit() is called twice', async () => {
      const tracerService = new TracerService(testTracerConfiguration);

      tracerService.onModuleInit();
      tracerService.onModuleInit();
    });

    it('should correctly get the tracer (enabled)', async () => {
      const tracerModule = await getTestingModule({ config: { serviceName: 'test', disable: false } });

      await tracerModule.init();

      const tracer = tracerModule.get(TracerService).getTracer();

      // When the tracer is enable it returns an Tracer instance from the jaeger-client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(tracer).to.be.instanceOf(require('jaeger-client').Tracer);

      await tracerModule.close();
    });

    it('should remove the tracer when the module is closed', async () => {
      const tracerModule = await getTestingModule();

      await tracerModule.init();

      const tracerService = tracerModule.get(TracerService);

      expect(tracerService.getTracer()).to.exist;

      await tracerModule.close();

      expect(() => tracerService.getTracer()).to.throw(TracerInitializationError);
    });
  });
});
