import { REQUEST_SPAN, RequestContext, RequestSpanService } from '@newtral/nestjs-jaeger';
import { Span } from 'opentracing';
import { anything, instance, mock, verify, when } from 'ts-mockito';

describe('RequestSpanService', () => {
  let requestContextMock: RequestContext;
  let requestSpanService: RequestSpanService;

  beforeEach(() => {
    requestContextMock = mock(RequestContext);
    requestSpanService = new RequestSpanService(instance(requestContextMock));
  });

  describe('#get()', () => {
    it('should correctly get the request span', async () => {
      const span = instance(mock(Span));

      when(requestContextMock.get(anything())).thenReturn(span);

      requestSpanService.get();

      verify(requestContextMock.get(REQUEST_SPAN)).once();
    });
  });

  describe('#set()', () => {
    it('should correctly set the request span', async () => {
      const span = instance(mock(Span));

      when(requestContextMock.has(anything())).thenReturn(false);
      when(requestContextMock.set(anything(), anything())).thenReturn();

      requestSpanService.set(span);

      verify(requestContextMock.has(REQUEST_SPAN)).once();
      verify(requestContextMock.set(REQUEST_SPAN, span)).once();
    });

    it('should not set the span more than once', async () => {
      const span = instance(mock(Span));

      when(requestContextMock.has(anything())).thenReturn(true);
      when(requestContextMock.set(anything(), anything())).thenReturn();

      requestSpanService.set(span);

      verify(requestContextMock.has(REQUEST_SPAN)).once();
      verify(requestContextMock.set(REQUEST_SPAN, span)).never();
    });
  });
});
