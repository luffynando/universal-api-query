import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Model from '#src/model';
import Post from '#tests/dummy/models/post';
import ModelWithParameterNames from '#tests/dummy/models/model_with_parameter_names';
import PostWithOptions from '#tests/dummy/models/post_with_options';
import type Builder from '#src/builder';

describe('query builder', () => {
  Model.$http = axios;
  const axiosMock = new MockAdapter(axios);

  beforeEach(() => {
    axiosMock.reset();
  });

  test('it builds a complex query', () => {
    const post = Post.include('user')
      .append('likes')
      .select({
        posts: ['title', 'content'],
        user: ['age', 'firstname'],
      })
      .where('title', 'Cool')
      .where('status', 'ACTIVE')
      .page(3)
      .limit(10)
      .orderBy('created_at')
      .params({
        doSomething: 'yes',
        process: 'no',
      });

    const query =
      '?include=user&append=likes&fields[posts]=title,content&fields[user]=age,firstname&filter[title]=Cool&filter[status]=ACTIVE&sort=created_at&page=3&limit=10&doSomething=yes&process=no';

    expect(post.getBuilder().query()).toEqual(query);
  });

  test('it builds a complex query with custom param names', () => {
    const post = ModelWithParameterNames.include('user')
      .append('likes')
      .select({
        posts: ['title', 'content'],
        user: ['age', 'firstname'],
      })
      .where('title', 'Cool')
      .where('status', 'ACTIVE')
      .page(3)
      .limit(10)
      .orderBy('created_at');

    const query =
      '?include_custom=user&append_custom=likes&fields_custom[posts]=title,content&fields_custom[user]=age,firstname&filter_custom[title]=Cool&filter_custom[status]=ACTIVE&sort_custom=created_at&page_custom=3&limit_custom=10';

    expect(post.getBuilder().query()).toEqual(query);
  });

  test('it can change default array format option', () => {
    let post = PostWithOptions.include('user').whereIn('status', ['published', 'archived']);

    expect(post.getBuilder().query()).toEqual(
      '?include=user&filter[status][0]=published&filter[status][1]=archived',
    );

    expect(post.getBuilder().filters).toEqual({
      status: ['published', 'archived'],
    });

    post = PostWithOptions.include('user').whereIn({
      user: {
        status: ['active', 'inactive'],
      },
    });

    expect(post.getBuilder().query()).toEqual(
      '?include=user&filter[user][status][0]=active&filter[user][status][1]=inactive',
    );

    expect(post.getBuilder().filters).toEqual({
      user: {
        status: ['active', 'inactive'],
      },
    });
  });

  test('include() sets properly the builder', () => {
    let post = Post.include('user');

    expect(post.getBuilder().includes).toEqual(['user']);

    post = Post.include('user', 'category');

    expect(post.getBuilder().includes).toEqual(['user', 'category']);

    post = Post.include(['user', 'category']);

    expect(post.getBuilder().includes).toEqual(['user', 'category']);
  });

  test('with() sets properly the builder', () => {
    let post = Post.with('user');

    expect(post.getBuilder().includes).toEqual(['user']);

    post = Post.with('user', 'category');

    expect(post.getBuilder().includes).toEqual(['user', 'category']);
  });

  test('append() sets properly the builder', () => {
    let post = Post.append('likes');

    expect(post.getBuilder().appends).toEqual(['likes']);

    post = Post.append('likes', 'visits');

    expect(post.getBuilder().appends).toEqual(['likes', 'visits']);

    post = Post.append(['likes', 'visits']);

    expect(post.getBuilder().appends).toEqual(['likes', 'visits']);
  });

  test('orderBy() sets properly the builder', () => {
    let post = Post.orderBy('created_at');

    expect(post.getBuilder().sorts).toEqual(['created_at']);

    post = Post.orderBy('created_at', '-visits');

    expect(post.getBuilder().sorts).toEqual(['created_at', '-visits']);

    post = Post.orderBy(['created_at', '-visits']);

    expect(post.getBuilder().sorts).toEqual(['created_at', '-visits']);
  });

  test('where() sets properly the builder', () => {
    let post = Post.where('id', 1);

    expect(post.getBuilder().filters).toEqual({ id: 1 });

    post = Post.where('id', 1).where('title', 'Cool');

    expect(post.getBuilder().filters).toEqual({ id: 1, title: 'Cool' });

    post = Post.where({
      user: {
        status: 'active',
      },
    });

    expect(post.getBuilder().filters).toEqual({ user: { status: 'active' } });
    expect(post.getBuilder().query()).toEqual('?filter[user][status]=active');

    post = Post.where({
      schedule: {
        start: '2020-11-27',
        end: '2020-11-28',
      },
    });

    expect(post.getBuilder().filters).toEqual({
      schedule: { start: '2020-11-27', end: '2020-11-28' },
    });
    expect(post.getBuilder().query()).toEqual(
      '?filter[schedule][start]=2020-11-27&filter[schedule][end]=2020-11-28',
    );

    post = Post.where({ id: 1, title: 'Cool' }).when(true, (query) =>
      query.where({ user: { status: 'active' } }),
    );

    expect(post.getBuilder().filters).toEqual({
      id: 1,
      title: 'Cool',
      user: {
        status: 'active',
      },
    });
  });

  test('where() throws a exception when doest not have params or only first param', () => {
    let errorModel: () => void;

    errorModel = () => {
      Post.where(undefined as unknown as string);
    };

    expect(errorModel).toThrow('The KEY and VALUE are required on where() method.');

    errorModel = () => {
      Post.where('id');
    };

    expect(errorModel).toThrow('The KEY and VALUE are required on where() method.');
  });

  test('where() throws a exception when second parameter is not primitive', () => {
    const errorModel = (): void => {
      Post.where('id', ['foo'] as unknown as string);
    };

    expect(errorModel).toThrow('The VALUE must be primitive on where() method.');
  });

  test('whereIn() sets properly the builder', () => {
    let post = Post.whereIn('status', ['ACTIVE', 'ARCHIVED']);

    expect(post.getBuilder().filters).toEqual({ status: ['ACTIVE', 'ARCHIVED'] });

    post = Post.whereIn({
      user: {
        status: ['active', 'inactive'],
      },
    });

    expect(post.getBuilder().filters).toEqual({
      user: { status: ['active', 'inactive'] },
    });
    expect(post.getBuilder().query()).toEqual('?filter[user][status]=active,inactive');

    post = Post.whereIn({
      schedule: {
        start: ['2020-11-27', '2020-11-28'],
        end: ['2020-11-28', '2020-11-29'],
      },
    });

    expect(post.getBuilder().filters).toEqual({
      schedule: {
        start: ['2020-11-27', '2020-11-28'],
        end: ['2020-11-28', '2020-11-29'],
      },
    });
    expect(post.getBuilder().query()).toEqual(
      '?filter[schedule][start]=2020-11-27,2020-11-28&filter[schedule][end]=2020-11-28,2020-11-29',
    );

    post = Post.whereIn({ status: ['ACTIVE', 'ARCHIVED'] }).when(true, (query) =>
      query.whereIn({ user: { status: ['active', 'inactive'] } }),
    );

    expect(post.getBuilder().filters).toEqual({
      status: ['ACTIVE', 'ARCHIVED'],
      user: {
        status: ['active', 'inactive'],
      },
    });
  });

  test('whereIn() throws a exception when second parameter is not a array', () => {
    const errorModel = (): void => {
      Post.whereIn('id', 'foo' as unknown as string[]);
    };

    expect(errorModel).toThrow('The second argument on whereIn() method must be an array.');
  });

  test('page() sets properly the builder', () => {
    const post = Post.page(3);

    expect(post.getBuilder().pageValue).toEqual(3);
  });

  test('page() throws a exception when value is not a number', () => {
    const errorModel = (): void => {
      Post.page('foo' as unknown as number);
    };

    expect(errorModel).toThrow('The VALUE must be an integer on page() method.');
  });

  test('limit() sets properly the builder', () => {
    const post = Post.limit(10);

    expect(post.getBuilder().limitValue).toEqual(10);
  });

  test('limit() throws a exception when value is not a number', () => {
    const errorModel = (): void => {
      Post.limit('foo' as unknown as number);
    };

    expect(errorModel).toThrow('The VALUE must be an integer on limit() method.');
  });

  test('select() with no parameters', () => {
    const errorModel = (): void => {
      Post.select();
    };

    expect(errorModel).toThrow('You must specify the fields on select() method.');
  });

  test('select() for single entity', () => {
    const post = Post.select('age', 'firstname');

    expect(post.getBuilder().fields.posts).toEqual(['age', 'firstname']);
  });

  test('select() for related entities', () => {
    const post = Post.select({
      posts: ['title', 'content'],
      user: ['age', 'firstname'],
    });

    expect(post.getBuilder().fields.posts).toEqual(['title', 'content']);
    expect(post.getBuilder().fields.user).toEqual(['age', 'firstname']);
  });

  test('params() sets properly the builder', () => {
    let post = Post.params({ doSomething: 'yes' });

    expect(post.getBuilder().payload).toEqual({ doSomething: 'yes' });

    post = Post.params({ foo: 'bar', baz: ['a', 'b'] });

    expect(post.getBuilder().payload).toEqual({ foo: 'bar', baz: ['a', 'b'] });
    expect(post.getBuilder().query()).toEqual('?foo=bar&baz=a,b');
  });

  test('params() throws a exception when the payload is not an object', () => {
    const errorModel = (): void => {
      Post.params(undefined as unknown as Record<string, unknown>);
    };

    expect(errorModel).toThrow('You must pass a payload/object as param.');
  });

  test('when() sets properly the builder', () => {
    let search = '';
    let post = Post.when(search, (query, value) => query.where('title', value));

    expect(post.getBuilder().filters).toEqual({});

    search = 'foo';
    post = Post.when(search, (query, value) => query.where('title', value));

    expect(post.getBuilder().filters).toEqual({ title: 'foo' });
  });

  test('when() throws a exception when callback is not a function', () => {
    const errorModel = (): void => {
      Post.when(
        undefined as unknown,
        undefined as unknown as (query: Builder, value: unknown) => void,
      );
    };

    expect(errorModel).toThrow('The CALLBACK is required and must be a function on when() method.');
  });

  test('it resets the uri upon query generation when the query is regenerated a second time', () => {
    const post = Post.where('title', 'Cool').page(4);

    const query = '?filter[title]=Cool&page=4';

    expect(post.getBuilder().query()).toEqual(query);
    expect(post.getBuilder().query()).toEqual(query);
  });
});
