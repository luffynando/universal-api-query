import { type HttpRequestConfig, type HttpPromise } from '#src/contracts/universal_api_query';
import Model from '#src/model';

export default class BaseModel extends Model {
  public baseUrl(): string {
    return 'http://localhost';
  }

  public async request(config: HttpRequestConfig): HttpPromise {
    return (this.$http as { request: (config: HttpRequestConfig) => HttpPromise }).request(config);
  }
}
