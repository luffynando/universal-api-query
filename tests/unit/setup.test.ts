import EmptyBaseModel from '#tests/dummy/models/empty_base_model';
import Post from '#tests/dummy/models/post';

describe('setup models', () => {
  const errorModel = (): EmptyBaseModel => new EmptyBaseModel();

  beforeEach(() => {
    EmptyBaseModel.reset().witHttp();
  });

  test('it throws an error if http property has not been set', () => {
    EmptyBaseModel.reset().withBaseUrl().withRequest();

    expect(errorModel).toThrow('You must set $http property');
  });

  test('it throws an error if baseUrl() method was not declared', () => {
    EmptyBaseModel.reset().withRequest().witHttp();

    expect(errorModel).toThrow('You must declare baseUrl() method.');
  });

  test('it throws an error if request() method was not declared', () => {
    EmptyBaseModel.reset().withBaseUrl().witHttp();

    expect(errorModel).toThrow('You must declare request() method.');
  });

  test('the resource method pluralizes the class name', () => {
    const post = new Post();

    expect(post.resource()).toEqual('posts');
  });

  test('the resource method can be overrided', () => {
    Post.prototype.resource = () => {
      return 'postz';
    };

    const post = new Post();

    expect(post.resource()).toEqual('postz');

    // @ts-expect-error - Hard delete methods
    delete Post.prototype.resource;
  });

  test('the primaryKey method can be overrided', () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post();

    expect(post.primaryKey()).toEqual('someId');

    // @ts-expect-error - Hard delete methods
    delete Post.prototype.primaryKey;
  });

  test('the baseUrl method can be overrided', () => {
    Post.prototype.baseUrl = () => {
      return 'http://api.com';
    };

    const post = new Post();

    expect(post.baseUrl()).toEqual('http://api.com');

    // @ts-expect-error - Hard delete methods
    delete Post.prototype.baseUrl;
  });
});
