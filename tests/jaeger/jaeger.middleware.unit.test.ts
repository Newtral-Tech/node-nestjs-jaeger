import { JaegerMiddleware, RequestContext, RequestSpanService, SpanService, TracerService } from '@newtral/nestjs-jaeger';
import { EventEmitter } from 'events';
import { Request, Response } from 'express';
import faker from 'faker';
import { Span, SpanContext, Tags } from 'opentracing';
import { anyFunction, anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';

describe('JaegerMiddleware', () => {
  let jaegerMiddleware: JaegerMiddleware;

  let tracerServiceMock: TracerService;
  let spanServiceMock: SpanService;
  let requestContextMock: RequestContext;
  let requestSpanServiceMock: RequestSpanService;

  let spanMock: Span;

  beforeEach(() => {
    tracerServiceMock = mock(TracerService);
    spanServiceMock = mock(SpanService);

    spanMock = mock();
    requestContextMock = mock(RequestContext);
    requestSpanServiceMock = mock(RequestSpanService);

    jaegerMiddleware = new JaegerMiddleware(
      instance(tracerServiceMock),
      instance(spanServiceMock),
      instance(requestContextMock),
      instance(requestSpanServiceMock)
    );
  });

  it('should correctly start an active span', async () => {
    const { request, response, parentSpan, span, url } = getTestData();

    when(requestContextMock.run(anything())).thenCall((fn, ...args) => fn(...args));
    when(tracerServiceMock.extractSpanFromHeaders(anything())).thenReturn(parentSpan);
    when(spanServiceMock.startActiveSpan(anything(), anything())).thenReturn(span);
    when(requestSpanServiceMock.set(anything())).thenReturn();
    when(spanMock.setTag(anything(), anything())).thenReturn();
    when(spanServiceMock.finishSpan(anything())).thenReturn();

    await new Promise(resolve => jaegerMiddleware.use(request, response, resolve));

    response.emit('finish');

    verify(requestContextMock.run(anyFunction())).once();
    verify(tracerServiceMock.extractSpanFromHeaders(request.headers)).once();

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

    verify(requestSpanServiceMock.set(span)).once();

    verify(spanMock.setTag(Tags.HTTP_STATUS_CODE, response.statusCode)).once();
    verify(spanServiceMock.finishSpan(span)).once();
  });

  function getTestData() {
    const request = new EventEmitter() as Request;

    const baseUrl = `/${faker.datatype.uuid()}`;
    const path = `/${faker.datatype.uuid()}`;
    const url = baseUrl + path;

    request.headers = {};

    request.baseUrl = baseUrl;
    request.path = path;
    request.method = faker.random.arrayElement(['get', 'post', 'put', 'patch']);

    const response = new EventEmitter() as Response;
    response.statusCode = faker.datatype.number();

    const parentSpan: SpanContext = instance(mock());
    const span: Span = instance(spanMock);

    return { request, response, span, parentSpan, url };
  }
});
