import { Injector } from './interfaces/interfaces';

export class InjectorImpl implements Injector {
  private container = new Map<string, any>();

  set<T>(token: string, instance: T) {
    this.container.set(token, instance);
  }

  get<T>(token: string, ...args: any): T {
    return this.container.get(token);
  }
}
