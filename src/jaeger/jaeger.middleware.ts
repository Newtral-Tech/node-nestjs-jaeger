import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FORMAT_HTTP_HEADERS, Tags } from 'opentracing';
import { markAsErroredSpan, SpanService } from './span.service';
import { TracerService } from './tracer.service';

@Injectable()
export class JaegerMiddleware implements NestMiddleware {
  constructor(private readonly tracerService: TracerService, private readonly spanService: SpanService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const tracer = this.tracerService.getTracer();
    const parentSpan = tracer.extract(FORMAT_HTTP_HEADERS, req.headers) ?? undefined;

    const url = req.path != '/' ? req.baseUrl + req.path : req.baseUrl;

    const span = this.spanService.startActiveSpan(url, {
      childOf: parentSpan,
      tags: {
        [Tags.SPAN_KIND]: Tags.SPAN_KIND_MESSAGING_PRODUCER,
        [Tags.HTTP_METHOD]: req.method,
        [Tags.HTTP_URL]: url
      }
    });

    res.once('finish', () => {
      span.setTag(Tags.HTTP_STATUS_CODE, res.statusCode);

      if (res.statusCode >= 500) {
        markAsErroredSpan(span);
      }

      this.spanService.finishSpan(span);
    });

    next();
  }
}
