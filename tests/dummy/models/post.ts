import BaseModel from './base_model';
import Comment from './comment';
import Tag from './tag';
import User from './user'; // eslint-disable-line import/no-cycle

export default class Post extends BaseModel {
  public declare id: number;

  public declare user: User;

  public declare relationships: { tags: Tag[] };

  public comments(): Comment {
    return this.hasMany(Comment);
  }

  public relations(): Record<string, typeof User | typeof Tag> {
    return {
      'user': User,
      'relationships.tags': Tag,
    };
  }
}
