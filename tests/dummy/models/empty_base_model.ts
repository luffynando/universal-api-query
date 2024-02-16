import { type HttpRequestConfig, type HttpPromise } from '#src/contracts/universal_api_query';
import Model from '#src/model';

export default class EmptyBaseModel extends Model {
  public static withBaseUrl(): typeof EmptyBaseModel {
    EmptyBaseModel.prototype.baseUrl = () => {
      return 'foo';
    };

    return this;
  }

  public static withRequest(): typeof EmptyBaseModel {
    EmptyBaseModel.prototype.request = async (_config) => {
      return 'foo' as unknown as HttpPromise;
    };

    return this;
  }

  public static witHttp(): typeof EmptyBaseModel {
    Model.$http = 'foo';

    return this;
  }

  public static reset(): typeof EmptyBaseModel {
    // @ts-expect-error - Hard delete methods
    delete EmptyBaseModel.prototype.baseUrl;
    // @ts-expect-error - Hard delete methods
    delete EmptyBaseModel.prototype.request;
    Model.$http = undefined;

    return this;
  }

  public declare baseUrl: () => string;

  public declare request: (config: HttpRequestConfig) => HttpPromise;
}
