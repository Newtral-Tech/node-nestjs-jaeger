import { Test, TestingModule } from '@nestjs/testing';
import { JaegerModule, TracerConfiguration } from '@newtral/nestjs-jaeger';

export const testTracerConfiguration: TracerConfiguration = { config: { disable: true } };

export function getTestingModule(config: TracerConfiguration = testTracerConfiguration): Promise<TestingModule> {
  return Test.createTestingModule({ imports: [JaegerModule.forRoot(config)], exports: [JaegerModule] }).compile();
}
