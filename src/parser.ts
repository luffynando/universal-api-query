import { stringify } from 'qs';
import type Builder from './builder';
import { type QueryParameterNames } from './contracts/universal_api_query';

export default class Parser {
  public _uri: string;

  private readonly _builder: Builder;

  constructor(builder: Builder) {
    this._builder = builder;
    this._uri = '';
  }

  public query(): string {
    this.reset();
    this.includes();
    this.appends();
    this.fields();
    this.filters();
    this.sorts();
    this.page();
    this.limit();
    this.payload();

    return this._uri;
  }

  public reset(): void {
    this._uri = '';
  }

  public hasIncludes(): boolean {
    return this._builder.includes.length > 0;
  }

  public hasAppends(): boolean {
    return this._builder.appends.length > 0;
  }

  public hasFields(): boolean {
    return Object.keys(this._builder.fields).length > 0;
  }

  public hasFilters(): boolean {
    return Object.keys(this._builder.filters).length > 0;
  }

  public hasSorts(): boolean {
    return this._builder.sorts.length > 0;
  }

  public hasPage(): boolean {
    return (this._builder.pageValue ?? false) !== false;
  }

  public hasLimit(): boolean {
    return (this._builder.limitValue ?? false) !== false;
  }

  public hasPayload(): boolean {
    return (this._builder.payload ?? false) !== false;
  }

  public prepend(): string {
    return this._uri === '' ? '?' : '&';
  }

  public parameterNames(): QueryParameterNames {
    return this._builder.model.parameterNames();
  }

  public includes(): void {
    if (!this.hasIncludes()) {
      return;
    }

    this._uri +=
      this.prepend() + this.parameterNames().include + '=' + this._builder.includes.join(',');
  }

  public appends(): void {
    if (!this.hasAppends()) {
      return;
    }

    this._uri +=
      this.prepend() + this.parameterNames().append + '=' + this._builder.appends.join(',');
  }

  public fields(): void {
    if (!this.hasFields()) {
      return;
    }

    const fields = { [this.parameterNames().fields]: this._builder.fields };
    this._uri +=
      this.prepend() +
      stringify(fields, { encode: false, ...this._builder.model.stringifyOptions() });
  }

  public filters(): void {
    if (!this.hasFilters()) {
      return;
    }

    const filters = { [this.parameterNames().filter]: this._builder.filters };
    this._uri +=
      this.prepend() +
      stringify(filters, { encode: false, ...this._builder.model.stringifyOptions() });
  }

  public sorts(): void {
    if (!this.hasSorts()) {
      return;
    }

    this._uri += this.prepend() + this.parameterNames().sort + '=' + this._builder.sorts.join(',');
  }

  public page(): void {
    if (!this.hasPage()) {
      return;
    }

    this._uri += this.prepend() + this.parameterNames().page + '=' + this._builder.pageValue;
  }

  public limit(): void {
    if (!this.hasLimit()) {
      return;
    }

    this._uri += this.prepend() + this.parameterNames().limit + '=' + this._builder.limitValue;
  }

  public payload(): void {
    if (!this.hasPayload()) {
      return;
    }

    this._uri +=
      this.prepend() +
      stringify(this._builder.payload, {
        encode: false,
        ...this._builder.model.stringifyOptions(),
      });
  }
}
