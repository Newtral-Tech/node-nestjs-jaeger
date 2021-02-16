import { JaegerMiddleware, SpanService, TracerService } from '@newtral/nestjs-jaeger';
import { EventEmitter } from 'events';
import { Request, Response } from 'express';
import faker from 'faker';
import { JaegerTracer } from 'jaeger-client';
import { FORMAT_HTTP_HEADERS, Span, SpanContext, Tags } from 'opentracing';
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';

describe('JaegerMiddleware', () => {
  let jaegerMiddleware: JaegerMiddleware;

  let tracerServiceMock: TracerService;
  let spanServiceMock: SpanService;

  let spanMock: Span;
  let jaegerTracerMock: JaegerTracer;

  beforeEach(() => {
    tracerServiceMock = mock(TracerService);
    spanServiceMock = mock(SpanService);

    spanMock = mock();
    jaegerTracerMock = mock();

    jaegerMiddleware = new JaegerMiddleware(instance(tracerServiceMock), instance(spanServiceMock));
  });

  it('should correctly start an active span', async () => {
    const { request, response, parentSpan, span, tracer, url } = getTestData();

    when(tracerServiceMock.getTracer()).thenReturn(tracer);
    when(jaegerTracerMock.extract(anything(), anything())).thenReturn(parentSpan);
    when(spanServiceMock.startActiveSpan(anything(), anything())).thenReturn(span);
    when(spanMock.setTag(anything(), anything())).thenReturn();
    when(spanServiceMock.finishSpan(anything())).thenReturn();

    await new Promise(resolve => jaegerMiddleware.use(request, response, resolve));

    response.emit('finish');

    verify(tracerServiceMock.getTracer()).once();
    verify(jaegerTracerMock.extract(FORMAT_HTTP_HEADERS, request.headers)).once();

    verify(
      spanServiceMock.startActiveSpan(
        url,
        deepEqual({
          childOf: parentSpan,
          tags: {
            [Tags.SPAN_KIND]: Tags.SPAN_KIND_MESSAGING_PRODUCER,
            [Tags.HTTP_METHOD]: request.method,
            [Tags.HTTP_URL]: url
          }
        })
      )
    ).once();

    verify(spanMock.setTag(Tags.HTTP_STATUS_CODE, response.statusCode)).once();
    verify(spanServiceMock.finishSpan(span)).once();
  });

  function getTestData() {
    const request = new EventEmitter() as Request;

    const baseUrl = `/${faker.random.uuid()}`;
    const path = `/${faker.random.uuid()}`;
    const url = baseUrl + path;

    request.headers = {};

    request.baseUrl = baseUrl;
    request.path = path;
    request.method = faker.random.arrayElement(['get', 'post', 'put', 'patch']);

    const response = new EventEmitter() as Response;
    response.statusCode = faker.random.number();

    const parentSpan: SpanContext = instance(mock());
    const span: Span = instance(spanMock);
    const tracer: JaegerTracer = instance(jaegerTracerMock);

    return { request, response, span, parentSpan, tracer, url };
  }
});
