import type Builder from './builder';
import { type QueryPromise, type HttpRequestConfig } from './contracts/universal_api_query';
import type Model from './model';

type InstantiableClass<T> = new () => T;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class StaticModel {
  public static instance<M extends typeof Model>(this: M): InstanceType<M> {
    return new (this as unknown as InstantiableClass<M>)() as InstanceType<M>;
  }

  public static config<M extends typeof Model>(
    this: M,
    config: HttpRequestConfig,
  ): InstanceType<M> {
    const self = this.instance();
    self.config(config);

    return self;
  }

  public static include<M extends typeof Model>(
    this: M,
    ...arguments_: string[] | string[][]
  ): InstanceType<M> {
    const self = this.instance();
    self.include(...arguments_);

    return self;
  }

  public static with<M extends typeof Model>(
    this: M,
    ...arguments_: string[] | string[][]
  ): InstanceType<M> {
    const self = this.instance();
    self.with(...arguments_);

    return self;
  }

  public static append<M extends typeof Model>(
    this: M,
    ...arguments_: string[] | string[][]
  ): InstanceType<M> {
    const self = this.instance();
    self.append(...arguments_);

    return self;
  }

  public static select<M extends typeof Model>(
    this: M,
    ...fields: string[] | string[][] | Array<Record<string, string[]>>
  ): InstanceType<M> {
    const self = this.instance();
    self.select(...fields);

    return self;
  }

  public static where<M extends typeof Model>(
    this: M,
    field: string | Record<string, unknown>,
    value?: string | number | boolean,
  ): InstanceType<M> {
    const self = this.instance();
    self.where(field, value);

    return self;
  }

  public static whereIn<M extends typeof Model>(
    this: M,
    field: string | Record<string, unknown>,
    array?: Array<string | number | boolean>,
  ): InstanceType<M> {
    const self = this.instance();
    self.whereIn(field, array);

    return self;
  }

  public static orderBy<M extends typeof Model>(
    this: M,
    ...arguments_: string[] | string[][]
  ): InstanceType<M> {
    const self = this.instance();
    self.orderBy(...arguments_);

    return self;
  }

  public static page<M extends typeof Model>(this: M, value: number): InstanceType<M> {
    const self = this.instance();
    self.page(value);

    return self;
  }

  public static limit<M extends typeof Model>(this: M, value: number): InstanceType<M> {
    const self = this.instance();
    self.limit(value);

    return self;
  }

  public static when<M extends typeof Model, T = unknown>(
    this: M,
    value: T,
    callback: (query: Builder, value: T) => void,
  ): InstanceType<M> {
    const self = this.instance();
    self.when(value, callback);

    return self;
  }

  public static custom<M extends typeof Model>(
    this: M,
    ...arguments_: Array<Model | string>
  ): InstanceType<M> {
    const self = this.instance();
    self.custom(...arguments_);

    return self;
  }

  public static params<M extends typeof Model>(
    this: M,
    payload: Record<string, unknown>,
  ): InstanceType<M> {
    const self = this.instance();
    self.params(payload);

    return self;
  }

  public static async first<M extends typeof Model>(this: M): QueryPromise<InstanceType<M>> {
    const self = this.instance();

    return self.first();
  }

  public static async $first<M extends typeof Model>(this: M): Promise<InstanceType<M>> {
    const self = this.instance();

    return self.$first();
  }

  public static async find<M extends typeof Model>(
    this: M,
    id: number | string,
  ): QueryPromise<InstanceType<M>> {
    const self = this.instance();

    return self.find(id);
  }

  public static async $find<M extends typeof Model>(
    this: M,
    id: number | string,
  ): Promise<InstanceType<M>> {
    const self = this.instance();

    return self.$find(id);
  }

  public static async get<M extends typeof Model>(this: M): QueryPromise<Array<InstanceType<M>>> {
    const self = this.instance();

    return self.get();
  }

  public static async all<M extends typeof Model>(this: M): QueryPromise<Array<InstanceType<M>>> {
    const self = this.instance();

    return self.all();
  }

  public static async $get<M extends typeof Model>(this: M): Promise<Array<InstanceType<M>>> {
    const self = this.instance();

    return self.$get();
  }

  public static async $all<M extends typeof Model>(this: M): Promise<Array<InstanceType<M>>> {
    const self = this.instance();

    return self.$all();
  }
}
