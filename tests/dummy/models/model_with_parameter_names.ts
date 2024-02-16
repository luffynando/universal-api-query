import BaseModel from './base_model';
import { type QueryParameterNames } from '#src/contracts/universal_api_query';

export default class ModelWithParameterNames extends BaseModel {
  public parameterNames(): QueryParameterNames {
    return {
      include: 'include_custom',
      filter: 'filter_custom',
      sort: 'sort_custom',
      fields: 'fields_custom',
      append: 'append_custom',
      page: 'page_custom',
      limit: 'limit_custom',
    };
  }
}
