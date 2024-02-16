import BaseModel from './base_model';

export default class Comment extends BaseModel {
  public declare replies: Comment[];

  public relations(): Record<string, typeof Comment> {
    return {
      replies: Comment,
    };
  }
}
