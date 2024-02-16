export type QueryParameterNames = {
  include: string;
  filter: string;
  sort: string;
  fields: string;
  append: string;
  page: string;
  limit: string;
};

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK';

export type HttpRequestConfig = {
  method?: Method;
  url?: string;
  data?: Record<string, unknown> | unknown;
  headers?: Record<string, unknown> | unknown;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  [key: string]: unknown;
};

export type HttpResponse<T> = {
  data: T;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  [key: string]: unknown;
};

export type HttpPromise<T = unknown> = Promise<HttpResponse<T>>;

export type QueryPromise<T> = Promise<T | HttpResponse<T>>;

// eslint-disable-next-line unicorn/prevent-abbreviations
type DefaultEncoder = (str: unknown, defaultEncoder?: unknown, charset?: string) => string;

export type StringifyOptions = {
  delimiter?: string | undefined;
  strictNullHandling?: boolean | undefined;
  skipNulls?: boolean | undefined;
  encode?: boolean | undefined;
  encoder?:
    | ((
        // eslint-disable-next-line unicorn/prevent-abbreviations
        str: unknown,
        defaultEncoder: DefaultEncoder,
        charset: string,
        type: 'key' | 'value',
      ) => string)
    | undefined;
  filter?: Array<string | number> | ((prefix: string, value: any) => any) | undefined;
  arrayFormat?: 'indices' | 'brackets' | 'repeat' | 'comma' | undefined;
  indices?: boolean | undefined;
  sort?: ((a: any, b: any) => number) | undefined;
  serializeDate?: ((d: Date) => string) | undefined;
  format?: 'RFC1738' | 'RFC3986' | undefined;
  encodeValuesOnly?: boolean | undefined;
  addQueryPrefix?: boolean | undefined;
  allowDots?: boolean | undefined;
  // eslint-disable-next-line unicorn/text-encoding-identifier-case
  charset?: 'utf-8' | 'iso-8859-1' | undefined;
  charsetSentinel?: boolean | undefined;
};
