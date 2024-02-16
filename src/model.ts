import getProp from 'dotprop';
import defu from 'defu';
import { dset as setProperties } from 'dset';
import { serialize } from 'object-to-formdata';
import Builder from './builder';
import StaticModel from './static_model';
import {
  type QueryParameterNames,
  type HttpRequestConfig,
  type QueryPromise,
  type HttpPromise,
  type StringifyOptions,
} from './contracts/universal_api_query';

export default abstract class Model extends StaticModel {
  public static $http: unknown;

  private declare readonly _builder: Builder;

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private _fromResource?: string;

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private _config?: HttpRequestConfig;

  private _customResource?: string;

  constructor(...attributes: unknown[]) {
    super();

    if (attributes.length === 0) {
      this._builder = new Builder(this);
    } else {
      Object.assign(this, ...attributes);
      this._applyRelations(this);
    }

    if (this.baseUrl === undefined) {
      throw new Error('You must declare baseUrl() method.');
    }

    if (this.request === undefined) {
      throw new Error('You must declare request() method.');
    }

    if (this.$http === undefined) {
      throw new Error('You must set $http property');
    }
  }

  public getBuilder(): Builder {
    return this._builder;
  }

  public config(config: HttpRequestConfig): this {
    Object.defineProperty(this, '_config', { get: () => config });

    return this;
  }

  public formData(): Partial<{
    indices: boolean;
    nullsAsUndefineds: boolean;
    booleansAsIntegers: boolean;
    allowEmptyArrays: boolean;
  }> {
    return {};
  }

  public resource(): string {
    return `${this.constructor.name.toLowerCase()}s`;
  }

  public primaryKey(): string {
    return 'id';
  }

  public getPrimaryKey(): string | number {
    return this[this.primaryKey() as keyof this] as string | number;
  }

  public custom(...arguments_: Array<Model | string>): this {
    if (arguments_.length === 0) {
      throw new Error('The custom() method takes a minimum of one argument.');
    }

    // It would be unintuitive for users to manage where the '/' has to be for
    // multiple arguments. We don't need it for the first argument if it's
    // a string, but subsequent string arguments need the '/' at the beginning.
    // We handle this implementation detail here to simplify the readme.
    let slash = '';
    let resource = '';

    for (const value of arguments_) {
      switch (true) {
        case typeof value === 'string': {
          resource += slash + value.replace(/^\/+/, '');
          break;
        }

        case value instanceof Model: {
          resource += slash + value.resource();
          if (value.isValidId(value.getPrimaryKey())) {
            resource += '/' + value.getPrimaryKey();
          }

          break;
        }

        default: {
          throw new Error('Arguments to custom() must be strings or instances of Model.');
        }
      }

      if (slash.length === 0) {
        slash = '/';
      }
    }

    this._customResource = resource;

    return this;
  }

  public hasMany<T extends Model>(model: new () => T): T {
    const instance = new model();
    const url = `${this.baseUrl()}/${this.resource()}/${this.getPrimaryKey()}/${instance.resource()}`;

    instance._from(url);

    return instance;
  }

  public for(...arguments_: Model[]): this {
    if (arguments_.length === 0) {
      throw new Error('The for() method takes a minimum of one argument.');
    }

    let url = `${this.baseUrl()}`;

    for (const object of arguments_) {
      if (!(object instanceof Model)) {
        throw new TypeError('The object referenced on for() method is not a valid Model.');
      }

      if (!this.isValidId(object.getPrimaryKey())) {
        throw new Error('The object referenced on for() method has an invalid id.');
      }

      url += `/${object.resource()}/${object.getPrimaryKey()}`;
    }

    url += `/${this.resource()}`;

    this._from(url);

    return this;
  }

  public relations(): Record<string, typeof Model> {
    return {};
  }

  public hasId(): boolean {
    const id = this.getPrimaryKey();
    return this.isValidId(id);
  }

  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  public isValidId(id: string | number): boolean {
    return Boolean(id);
  }

  public endpoint(): string {
    if (this._fromResource) {
      return this.hasId() ? `${this._fromResource}/${this.getPrimaryKey()}` : this._fromResource;
    }

    return this.hasId()
      ? `${this.baseUrl()}/${this.resource()}/${this.getPrimaryKey()}`
      : `${this.baseUrl()}/${this.resource()}`;
  }

  public parameterNames(): QueryParameterNames {
    return {
      include: 'include',
      filter: 'filter',
      sort: 'sort',
      fields: 'fields',
      append: 'append',
      page: 'page',
      limit: 'limit',
    };
  }

  public stringifyOptions(): StringifyOptions {
    return {
      arrayFormat: 'comma',
    };
  }

  public include(...arguments_: string[] | string[][]): this {
    this._builder.include(...arguments_);

    return this;
  }

  public with(...arguments_: string[] | string[][]): this {
    return this.include(...arguments_);
  }

  public append(...arguments_: string[] | string[][]): this {
    this._builder.append(...arguments_);

    return this;
  }

  public select(...fields: string[] | string[][] | Array<Record<string, string[]>>): this {
    this._builder.select(...fields);

    return this;
  }

  public where(field: string | Record<string, unknown>, value?: string | number | boolean): this {
    this._builder.where(field, value);

    return this;
  }

  public whereIn(
    field: string | Record<string, unknown>,
    array?: Array<string | number | boolean>,
  ): this {
    this._builder.whereIn(field, array);

    return this;
  }

  public orderBy(...arguments_: string[] | string[][]): this {
    this._builder.orderBy(...arguments_);

    return this;
  }

  public page(value: number): this {
    this._builder.page(value);

    return this;
  }

  public limit(value: number): this {
    this._builder.limit(value);

    return this;
  }

  public params(payload: Record<string, unknown>): this {
    this._builder.params(payload);

    return this;
  }

  public when<T = unknown>(value: T, callback: (query: Builder, value: T) => void): this {
    this._builder.when(value, callback);

    return this;
  }

  public async first(): QueryPromise<this> {
    return this.get().then((response) => {
      const item = (
        (response as unknown as Record<string, unknown[]>).data
          ? (response as unknown as Record<string, unknown[]>).data[0]
          : (response as unknown[])[0]
      ) as this | undefined;

      return (item ?? {}) as this;
    });
  }

  public async $first(): Promise<this> {
    return this.first().then(
      (response) => ((response as unknown as { data?: Model }).data ?? response) as this,
    );
  }

  public async find(identifier: number | string): QueryPromise<this> {
    if (identifier === undefined) {
      throw new Error('You must specify the param on find() method.');
    }

    const base = this._fromResource ?? `${this.baseUrl()}/${this.resource()}`;
    const url = `${base}/${identifier}${this._builder.query()}`;

    return this.request(
      this._reqConfig({
        url,
        method: 'GET',
      }),
    ).then((response) => {
      return this._applyInstance<this>(response.data);
    });
  }

  public async $find(identifier: number | string): Promise<this> {
    if (identifier === undefined) {
      throw new Error('You must specify the param on $find() method.');
    }

    return this.find(identifier).then((response) =>
      this._applyInstance<this>((response as unknown as { data?: unknown }).data ?? response),
    );
  }

  public async get(): QueryPromise<this[]> {
    let base = this._fromResource ?? `${this.baseUrl()}/${this.resource()}`;
    base = this._customResource ? `${this.baseUrl()}/${this._customResource}` : base;
    const url = `${base}${this._builder.query()}`;

    return this.request(
      this._reqConfig({
        url,
        method: 'GET',
      }),
    ).then((response) => {
      const collection = this._applyInstanceCollection(response.data as Record<string, unknown>);

      if ((response.data as Record<string, unknown>).data === undefined) {
        response.data = collection;
      } else {
        (response.data as Record<string, unknown>).data = collection;
      }

      return response.data as this[];
    });
  }

  public async $get(): Promise<this[]> {
    return this.get().then(
      (response) => ((response as unknown as { data?: Model[] }).data ?? response) as this[],
    );
  }

  public async all(): QueryPromise<this[]> {
    return this.get();
  }

  public async $all(): Promise<this[]> {
    return this.$get();
  }

  public async delete(): Promise<unknown> {
    if (this._customResource) {
      throw new Error(
        'The delete() method cannot be used in conjunction with the custom() method. Use for() instead.',
      );
    }

    if (!this.hasId()) {
      throw new Error('This model has a empty ID.');
    }

    return this.request(
      this._reqConfig({
        method: 'DELETE',
        url: this.endpoint(),
      }),
    ).then((response) => response);
  }

  public async save(): Promise<this> {
    if (this._customResource) {
      throw new Error(
        'The save() method cannot be used in conjunction with the custom() method. Use for() instead.',
      );
    }

    return this.hasId() ? this._update() : this._create();
  }

  public async patch(): Promise<this> {
    return this.config({ method: 'PATCH' }).save();
  }

  public async attach(parameters: Record<string, unknown>): Promise<unknown> {
    if (this._customResource) {
      throw new Error(
        'The attach() method cannot be used in conjunction with the custom() method. Use for() instead.',
      );
    }

    return this.request(
      this._reqConfig({
        method: 'POST',
        url: this.endpoint(),
        data: parameters,
      }),
    ).then((response) => response);
  }

  public async sync(parameters: Record<string, unknown>): Promise<unknown> {
    if (this._customResource) {
      throw new Error(
        'The sync() method cannot be used in conjunction with the custom() method. Use for() instead.',
      );
    }

    return this.request(
      this._reqConfig({
        method: 'PUT',
        url: this.endpoint(),
        data: parameters,
      }),
    ).then((response) => response);
  }

  public abstract baseUrl(): string;

  public abstract request(config: HttpRequestConfig): HttpPromise;

  private _from(url: string): void {
    Object.defineProperty(this, '_fromResource', { get: () => url });
  }

  private _applyInstance<T extends Model>(
    data: unknown,
    model: new (...arguments_: unknown[]) => T = this.constructor as new () => T,
  ): T {
    const item = new model(data);

    if (this._fromResource) {
      item._from(this._fromResource);
    }

    return item;
  }

  private _applyInstanceCollection<T extends Model>(
    data: Record<string, unknown>,
    model: new (...arguments_: unknown[]) => T = this.constructor as new () => T,
  ): T[] {
    const collectionData = data.data || data;
    let collection = Array.isArray(collectionData) ? collectionData : [collectionData];

    collection = collection.map((c) => {
      return this._applyInstance(c, model);
    });

    return collection as T[];
  }

  private _applyRelations<T extends Model>(model: T): void {
    const relations = model.relations();

    for (const relation of Object.keys(relations)) {
      const _relation: Record<string, unknown> = getProp(model, relation);

      if (!_relation) {
        continue;
      }

      if (Array.isArray(_relation.data) || Array.isArray(_relation)) {
        const collection = this._applyInstanceCollection(
          _relation,
          relations[relation] as unknown as new (...arguments_: unknown[]) => T,
        );

        if (_relation.data === undefined) {
          setProperties(model, relation, collection);
        } else {
          _relation.data = collection;
        }
      } else {
        setProperties(
          model,
          relation,
          this._applyInstance(
            _relation,
            relations[relation] as unknown as new (...arguments_: unknown[]) => T,
          ),
        );
      }
    }
  }

  private _reqConfig(
    config: HttpRequestConfig,
    options?: { forceMethod: boolean },
  ): HttpRequestConfig {
    options ??= { forceMethod: false };
    // Merge config, recursively. Leftmost arguments have more priority.
    const _config = defu(this._config, config);

    // Prevent default request method from being overridden
    if (options.forceMethod) {
      _config.method = config.method;
    }

    // Check if config has data
    if ('data' in _config) {
      const configData = _config.data as Record<string, unknown>;
      const _hasFiles = Object.keys(configData).some((property) => {
        if (Array.isArray(configData[property])) {
          return (configData[property] as unknown[]).some((value) => value instanceof File);
        }

        return configData[property] instanceof File;
      });

      // Check if the data has files
      if (_hasFiles) {
        // Check if `config` has `headers` property
        if (!('headers' in _config)) {
          // If not, then set an empty object
          _config.headers = {};
        }

        // Set header Content-Type
        (_config.headers as Record<string, unknown>)['Content-Type'] = 'multipart/form-data';

        // Convert object to form data
        _config.data = serialize(_config.data, this.formData());
      }
    }

    return _config;
  }

  private async _create<T extends Model>(): Promise<T> {
    return this.request(
      this._reqConfig(
        {
          method: 'POST',
          url: this.endpoint(),
          data: this,
        },
        { forceMethod: true },
      ),
    ).then((response) => {
      return this._applyInstance<T>(
        (response.data as Record<string, unknown>).data || response.data,
      );
    });
  }

  private async _update<T extends Model>(): Promise<T> {
    return this.request(
      this._reqConfig({
        method: 'PUT',
        url: this.endpoint(),
        data: this,
      }),
    ).then((response) => {
      return this._applyInstance<T>(
        (response.data as Record<string, unknown>).data || response.data,
      );
    });
  }

  public get $http(): unknown {
    return Model.$http;
  }
}
