import type Model from './model';
import Parser from './parser';

export default class Builder {
  public includes: string[];

  public appends: string[];

  public sorts: string[];

  public fields: Record<string, string[]>;

  public filters: Record<string, unknown>;

  public payload?: Record<string, unknown>;

  public pageValue?: number;

  public limitValue?: number;

  private readonly _parser: Parser;

  constructor(public readonly model: Model) {
    this.model = model;
    this.includes = [];
    this.appends = [];
    this.sorts = [];
    this.pageValue = undefined;
    this.limitValue = undefined;
    this.payload = undefined;

    this.fields = {};
    this.filters = {};

    this._parser = new Parser(this);
  }

  public query(): string {
    return this._parser.query();
  }

  public include(...relationships: string[] | string[][]): this {
    this.includes = relationships.flat();

    return this;
  }

  public append(...attributes: string[] | string[][]): this {
    this.appends = attributes.flat();

    return this;
  }

  public select(...fields: string[] | string[][] | Array<Record<string, string[]>>): this {
    if (fields.length === 0) {
      throw new Error('You must specify the fields on select() method.');
    }

    if (typeof fields[0] === 'string' || Array.isArray(fields[0])) {
      this.fields[this.model.resource()] = fields as string[];
    }

    if (typeof fields[0] === 'object') {
      for (const [key, value] of Object.entries(fields[0])) {
        this.fields[key] = value as string[];
      }
    }

    return this;
  }

  public where(key: string | Record<string, unknown>, value?: string | number | boolean): this {
    if (key === undefined || (typeof key !== 'object' && value === undefined)) {
      throw new Error('The KEY and VALUE are required on where() method.');
    }

    if (Array.isArray(value) || typeof value === 'object') {
      throw new TypeError('The VALUE must be primitive on where() method.');
    }

    if (typeof key === 'object') {
      this.filters = {
        ...this.filters,
        ...key,
      };
    } else {
      this.filters[key] = value;
    }

    return this;
  }

  public whereIn(
    key: string | Record<string, unknown>,
    array?: Array<string | number | boolean>,
  ): this {
    if (typeof key !== 'object' && !Array.isArray(array)) {
      throw new TypeError('The second argument on whereIn() method must be an array.');
    }

    if (typeof key === 'object') {
      this.filters = {
        ...this.filters,
        ...key,
      };
    } else {
      this.filters[key] = array;
    }

    return this;
  }

  public orderBy(...fields: string[] | string[][]): this {
    this.sorts = fields.flat();

    return this;
  }

  public page(value: number): this {
    if (!Number.isInteger(value)) {
      throw new TypeError('The VALUE must be an integer on page() method.');
    }

    this.pageValue = value;

    return this;
  }

  public limit(value: number): this {
    if (!Number.isInteger(value)) {
      throw new TypeError('The VALUE must be an integer on limit() method.');
    }

    this.limitValue = value;

    return this;
  }

  public params(payload: Record<string, unknown>): this {
    if (payload === undefined || typeof payload !== 'object') {
      throw new TypeError('You must pass a payload/object as param.');
    }

    this.payload = payload;

    return this;
  }

  public when<T = unknown>(value: T, callback: (query: this, value: T) => void): this {
    if (typeof callback !== 'function') {
      throw new TypeError('The CALLBACK is required and must be a function on when() method.');
    }

    if (value) {
      callback(this, value);
    }

    return this;
  }
}
