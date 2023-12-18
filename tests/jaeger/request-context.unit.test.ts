import { expect } from 'chai';
import { RequestContext } from '@newtral/nestjs-jaeger';
import { AsyncLocalStorage } from 'async_hooks';
import { faker } from '@faker-js/faker';
import { anyOfClass, anything, instance, mock, spy, verify, when } from 'ts-mockito';

describe('RequestContext', () => {
  let store: Map<unknown, unknown>;
  let storeSpy: Map<unknown, unknown>;

  let storageMock: AsyncLocalStorage<Map<unknown, unknown>>;
  let requestContext: RequestContext;

  beforeEach(() => {
    store = new Map();
    storeSpy = spy(store);

    storageMock = mock(AsyncLocalStorage);
    requestContext = new RequestContext(instance(storageMock));
  });

  afterEach(() => store.clear());

  describe('#get()', () => {
    it('should correctly get an item when the store is defined', async () => {
      const key = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(store);

      requestContext.get(key);

      verify(storageMock.getStore()).once();
      verify(storeSpy.get(key)).once();
    });

    it('should not fail when the store is undefined', async () => {
      const key = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(undefined);

      requestContext.get(key);

      verify(storageMock.getStore()).once();
      verify(storeSpy.get(anything())).never();
    });
  });

  describe('#set()', () => {
    it('should correctly set an item when the store is defined', async () => {
      const key = faker.string.uuid();
      const value = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(store);

      requestContext.set(key, value);

      verify(storageMock.getStore()).once();
      verify(storeSpy.set(key, value)).once();
    });

    it('should not fail when the store is undefined', async () => {
      const key = faker.string.uuid();
      const value = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(undefined);

      requestContext.set(key, value);

      verify(storageMock.getStore()).once();
      verify(storeSpy.set(anything(), anything())).never();
    });
  });

  describe('#has()', () => {
    it('should correctly get an item when the store is defined', async () => {
      const key = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(store);

      requestContext.has(key);

      verify(storageMock.getStore()).once();
      verify(storeSpy.has(key)).once();
    });

    it('should not fail when the store is undefined', async () => {
      const key = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(undefined);

      const found = requestContext.has(key);

      expect(found).to.be.false;

      verify(storageMock.getStore()).once();
      verify(storeSpy.has(anything())).never();
    });
  });

  describe('#delete()', () => {
    it('should correctly remove an item when the store is defined', async () => {
      const key = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(store);

      requestContext.delete(key);

      verify(storageMock.getStore()).once();
      verify(storeSpy.delete(key)).once();
    });

    it('should not fail when the store is undefined', async () => {
      const key = faker.string.uuid();

      when(storageMock.getStore()).thenReturn(undefined);

      requestContext.delete(key);

      verify(storageMock.getStore()).once();
      verify(storeSpy.delete(anything())).never();
    });
  });

  describe('#run()', () => {
    it('should correctly run the callback ', async () => {
      const fn = () => undefined;

      when(storageMock.run(anything(), anything(), anything())).thenReturn();

      requestContext.run(fn);

      verify(storageMock.run(anyOfClass(Map), fn)).once();
    });

    it('should correctly run the callback with args', async () => {
      const arg = faker.string.uuid();
      const fn = () => undefined;

      when(storageMock.run(anything(), anything(), anything())).thenReturn();

      requestContext.run(fn, arg);

      // @ts-ignore
      verify(storageMock.run(anyOfClass(Map), fn, arg)).once();
    });
  });
});
