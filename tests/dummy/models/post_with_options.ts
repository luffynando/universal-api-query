import BaseModel from './base_model';
import User from './user';
import Tag from './tag';
import Comment from './comment';
import { type StringifyOptions } from '#src/contracts/universal_api_query';

export default class PostWithOptions extends BaseModel {
  public comments(): Comment {
    return this.hasMany(Comment);
  }

  public relations(): Record<string, typeof User | typeof Tag> {
    return {
      'user': User,
      'relationships.tags': Tag,
    };
  }

  public stringifyOptions(): StringifyOptions {
    return {
      arrayFormat: 'indices',
    };
  }
}
