import BaseModel from './base_model';
import Post from './post'; // eslint-disable-line import/no-cycle

export default class User extends BaseModel {
  public declare id: number;

  public declare firstname: string;

  public declare lastname: string;

  public get fullname(): string {
    return `${this.firstname} ${this.lastname}`;
  }

  public posts(): Post {
    return this.hasMany(Post);
  }
}
