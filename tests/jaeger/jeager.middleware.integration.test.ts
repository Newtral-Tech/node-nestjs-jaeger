// eslint-disable-next-line max-classes-per-file
import { Controller, Get, Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import axios from 'axios';
import { expect } from 'chai';
import faker from 'faker';
import { JaegerMiddleware, JaegerModule, RequestContext, RequestSpanService } from '../../src';

const REQUEST_ID = 'requestId';

@Injectable()
class MyService {
  constructor(private readonly requestContext: RequestContext) {}

  async isSameRequest(requestId: string): Promise<void> {
    expect(this.requestContext.get(REQUEST_ID)).to.be.equal(requestId);
  }
}

@Controller()
class MyController {
  constructor(
    private readonly requestContext: RequestContext,
    private readonly requestSpanService: RequestSpanService,
    private readonly myService: MyService
  ) {}

  @Get()
  async get(): Promise<string> {
    // Check the RequestIdMiddleware is working
    const requestId = this.requestContext.get(REQUEST_ID) as string;
    expect(requestId).to.be.a('string');

    // Check the span is set
    const span = this.requestSpanService.get();
    expect(span).to.exist;

    // Check inside a service
    await this.myService.isSameRequest(requestId);

    // Check for callbacks
    return await new Promise<string>((resolve, reject) => {
      setImmediate(() => {
        try {
          const intermediateId = this.requestContext.get(REQUEST_ID);
          expect(intermediateId).to.be.equal(requestId);
        } catch (err) {
          reject(err);
          return;
        }

        setTimeout(() => {
          try {
            const endingRequestId = this.requestContext.get(REQUEST_ID);
            expect(endingRequestId).to.be.equal(requestId);
            resolve(requestId);
          } catch (err) {
            reject(err);
          }
        }, 0);
      });
    });
  }
}

@Injectable()
class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContext) {}

  use(req: any, res: any, next: () => void): any {
    this.requestContext.set(REQUEST_ID, faker.datatype.uuid());

    next();
  }
}

@Module({
  controllers: [MyController],
  providers: [MyService, RequestIdMiddleware],
  imports: [
    JaegerModule.forRoot({
      config: {
        serviceName: 'test-service-name',
        reporter: {
          agentHost: 'localhost',
          agentPort: 6831
        }
      }
    })
  ]
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(JaegerMiddleware).forRoutes('*').apply(RequestIdMiddleware).forRoutes('*');
  }
}

describe('JaegerMiddleware Integration', () => {
  let app: NestExpressApplication;
  let url: string;

  before(async () => {
    app = await NestFactory.create(AppModule, { logger: ['error'] });

    await app.init();
    await app.listen(0);

    url = await app.getUrl();
  });

  after(() => app.close());

  it('should successfully integrate request context', async () => {
    const responses = await Promise.all(
      Array(10)
        .fill(null)
        .map(() => axios.get(url))
    );

    // Check every response it's an id
    expect([...new Set(responses.map(response => typeof response.data))]).to.be.deep.equal(['string']);
  });
});
