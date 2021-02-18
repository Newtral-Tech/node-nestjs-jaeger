import { Injectable, Optional } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class RequestContext {
  constructor(@Optional() private readonly store = new AsyncLocalStorage<Map<unknown, unknown>>()) {}

  get(key: unknown): unknown | undefined {
    return this.store.getStore()?.get(key);
  }

  set(key: unknown, value: unknown): void {
    this.store.getStore()?.set(key, value);
  }

  has(key: unknown): boolean {
    return this.store.getStore()?.has(key) ?? false;
  }

  delete(key: unknown): this {
    this.store.getStore()?.delete(key);

    return this;
  }

  run<R>(callback: (...args: any[]) => R, ...args: any[]): R {
    return this.store.run(new Map(), callback, ...args);
  }
}
