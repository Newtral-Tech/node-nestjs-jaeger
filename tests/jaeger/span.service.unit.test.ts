import { TestingModule } from '@nestjs/testing';
import { SpanService, TracerService, WithSpanOptions } from '@newtral/nestjs-jaeger';
import { getTestingModule } from '@tests/_helpers/module';
import { expect } from 'chai';
import faker from 'faker';
import { JaegerTracer } from 'jaeger-client';
import { Span, SpanOptions } from 'opentracing';
import { anything, instance, mock, spy, verify, when } from 'ts-mockito';

describe('SpanService', () => {
  let tracerModule: TestingModule;
  let spanService: SpanService;
  let tracerServiceMock: TracerService;

  let spanServiceSpy: SpanService;

  let jaegerTracerMock: JaegerTracer;
  let jaegerTracer: JaegerTracer;

  let testSpanMock: Span;
  let testSpan: Span;

  beforeEach(async () => {
    tracerModule = await getTestingModule();

    tracerServiceMock = mock(TracerService);
    spanService = new SpanService(instance(tracerServiceMock));

    spanServiceSpy = spy(spanService);

    jaegerTracerMock = mock();
    jaegerTracer = instance(jaegerTracerMock);

    testSpanMock = mock(Span);
    testSpan = instance(testSpanMock);

    await tracerModule.init();
  });

  afterEach(() => tracerModule.close());

  describe('#startSpan()', () => {
    it('should start a new span', async () => {
      const { options, name } = getTestData();

      when(tracerServiceMock.getTracer()).thenReturn(jaegerTracer);
      when(jaegerTracerMock.startSpan(anything(), anything())).thenReturn(testSpan);

      const span = spanService.startSpan(name, options);

      expect(span).to.be.equal(testSpan);

      verify(tracerServiceMock.getTracer()).once();
      verify(jaegerTracerMock.startSpan(name, options));
    });
  });

  describe('#startActiveSpan()', () => {
    it('should start an span and set it as active', async () => {
      const { options, name } = getTestData();

      when(spanServiceSpy.startSpan(anything(), anything())).thenReturn(testSpan);

      const span = spanService.startActiveSpan(name, options);

      const activeSpan = spanService.getActiveSpan();

      expect(span).to.be.equal(activeSpan);
    });
  });

  describe('#finishSpan()', () => {
    it('should should finish the span', async () => {
      when(testSpanMock.finish()).thenReturn();

      spanService.finishSpan(testSpan);

      verify(testSpanMock.finish()).once();
    });

    it('should finish the span and set the active span to undefined if it is the active one', async () => {
      const { options, name } = getTestData();

      when(spanServiceSpy.startSpan(anything(), anything())).thenReturn(testSpan);

      const span = spanService.startActiveSpan(name, options);
      const activeSpan = spanService.getActiveSpan();

      expect(span).to.be.equal(activeSpan);

      spanService.finishSpan(span);

      expect(spanService.getActiveSpan()).to.be.undefined;
      verify(testSpanMock.finish()).once();
    });
  });

  describe('#getActiveSpan()', () => {
    it('should return undefined when there is no active span', async () => {
      const span = spanService.getActiveSpan();

      expect(span).to.be.undefined;
    });
  });

  describe('#withSpan()', () => {
    it('should use a new span for the current given function', async () => {
      const { name, options } = getTestData();
      const result = faker.lorem.sentence();

      const withSpanOptions: WithSpanOptions = {
        name,
        options,
        active: false,
        handler: () => result
      };

      const withSpanOptionsSpy = spy(withSpanOptions);

      when(spanServiceSpy.startSpan(anything(), anything())).thenReturn(testSpan);
      when(spanServiceSpy.finishSpan(anything())).thenReturn();

      const withSpanResult = await spanService.withSpan(withSpanOptions);

      expect(withSpanResult).to.be.equal(result);

      verify(withSpanOptionsSpy.handler(testSpan)).once();
      verify(spanServiceSpy.startSpan(withSpanOptions.name, withSpanOptions.options)).once();
      verify(spanServiceSpy.finishSpan(testSpan)).once();
    });

    it('should use a new active span for the current given function', async () => {
      const { name, options } = getTestData();
      const result = faker.lorem.sentence();

      const withSpanOptions: WithSpanOptions = {
        name,
        options,
        active: true,
        handler: () => result
      };

      const withSpanOptionsSpy = spy(withSpanOptions);

      when(spanServiceSpy.startSpan(anything(), anything())).thenReturn(testSpan);
      when(spanServiceSpy.finishSpan(anything())).thenReturn();

      const withSpanResult = await spanService.withSpan(withSpanOptions);

      expect(withSpanResult).to.be.equal(result);

      verify(withSpanOptionsSpy.handler(testSpan)).once();
      verify(spanServiceSpy.startActiveSpan(withSpanOptions.name, withSpanOptions.options)).once();
      verify(spanServiceSpy.finishSpan(testSpan)).once();
    });
  });
});

function getTestData() {
  const name = faker.lorem.sentence();
  const options: SpanOptions = {
    startTime: faker.date.recent().getTime()
  };

  return { options, name };
}
