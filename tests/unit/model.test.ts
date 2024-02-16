import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Model from '#src/model';
import { type QueryPromise } from '#src/contracts/universal_api_query';
import Post from '#tests/dummy/models/post';
import User from '#tests/dummy/models/user';
import Tag from '#tests/dummy/models/tag';
import Comment from '#tests/dummy/models/comment';
import { getPosts } from '#tests/dummy/data/posts';
import { getPostsEmbed } from '#tests/dummy/data/posts_embed';
import { getPost } from '#tests/dummy/data/single_post';
import { getPostEmbed } from '#tests/dummy/data/single_post_embed';
import { getComments } from '#tests/dummy/data/comments';
import { getCommentsEmbed } from '#tests/dummy/data/comments_embed';

describe('model methods', () => {
  Model.$http = axios;
  const axiosMock = new MockAdapter(axios);

  beforeEach(() => {
    axiosMock.reset();
    Post.prototype.primaryKey = () => {
      return 'id';
    };
  });

  test('it throws a error when find() method has no parameters', async () => {
    const errorModel = async (): QueryPromise<Post> => Post.find(undefined as unknown as string);

    await expect(errorModel).rejects.toThrow('You must specify the param on find() method.');
  });

  test('it throws a error when $find() method has no parameters', async () => {
    const errorModel = async (): Promise<Post> => Post.$find(undefined as unknown as string);

    await expect(errorModel).rejects.toThrow('You must specify the param on $find() method');
  });

  test('first() returns first object in array as instance of such Model', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, { data: getPosts });
    const post = (await Post.first()) as Post;

    expect(post).toEqual(getPosts[0]);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('$first() returns first object in array as instance of such Model', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, getPostsEmbed);
    const post = await Post.$first();

    expect(post).toEqual(getPostsEmbed.data[0]);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('first() method returns a empty object when no items have found', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, []);
    const post = await Post.first();

    expect(post).toEqual({});
  });

  test('find() method returns a object as instance of such Model', async () => {
    axiosMock.onGet('http://localhost/posts/1').reply(200, getPost);
    const post = (await Post.find(1)) as Post;

    expect(post).toEqual(getPost);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('$find() handles request with "data" wrapper', async () => {
    axiosMock.onGet('http://localhost/posts/1').reply(200, getPostEmbed);
    const post = await Post.$find(1);

    expect(post).toEqual(getPostEmbed.data);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of (post.relationships.tags as unknown as { data: Tag[] }).data) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('$find() handles request without "data" wrapper', async () => {
    axiosMock.onGet('http://localhost/posts/1').reply(200, getPost);

    const post = await Post.$find(1);

    expect(post).toEqual(getPost);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('find() method returns a object as instance of such Model with empty relationships', async () => {
    const _postResponse: Record<string, unknown> = getPost;
    _postResponse.user = null;
    (_postResponse.relationships as Record<string, unknown>).tags = [];
    axiosMock.onGet('http://localhost/posts/1').reply(200, _postResponse);
    const post = (await Post.find(1)) as Post;

    expect(post).toEqual(getPost);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeNull();
    expect(post.relationships.tags).toStrictEqual([]);
  });

  test('find() method returns a object as instance of such Model with some empty relationships', async () => {
    const _postResponse: Record<string, unknown> = getPost;
    _postResponse.user = null;
    axiosMock.onGet('http://localhost/posts/1').reply(200, _postResponse);
    const post = (await Post.find(1)) as Post;

    expect(post).toEqual(getPost);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeNull();

    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('get() method returns a array of objects as instance of suchModel', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, getPosts);

    const posts = (await Post.get()) as Post[];

    for (const post of posts) {
      expect(post).toBeInstanceOf(Post);
      expect(post.user).toBeInstanceOf(User);
      for (const tag of post.relationships.tags) {
        expect(tag).toBeInstanceOf(Tag);
      }
    }
  });

  test('get() hits right resource (nested object)', async () => {
    axiosMock.onGet().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual('http://localhost/posts/1/comments');

      return [200, getComments];
    });
    const post = new Post({ id: 1 });
    const comments = (await post.comments().get()) as unknown as Comment[];

    for (const comment of comments) {
      expect(comment).toBeInstanceOf(Comment);
      for (const reply of comment.replies) {
        expect(reply).toBeInstanceOf(Comment);
      }
    }
  });

  test('get() hits right resource (nested object, custom PK)', async () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post({ id: 1, someId: 'po996-9dd18' }) as Post & { someId: string };

    axiosMock.onGet().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}/comments`);

      return [200, getComments];
    });

    const comments = (await post.comments().get()) as Comment[];

    for (const comment of comments) {
      expect(comment).toBeInstanceOf(Comment);
      for (const reply of comment.replies) {
        expect(reply).toBeInstanceOf(Comment);
      }
    }
  });

  test('$get() fetch style request with "data" wrapper', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, getPostsEmbed);
    const posts = await Post.$get();

    expect(posts).toEqual(getPostsEmbed.data);
  });

  test('$get() fetch style request without "data" wrapper', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, getPostsEmbed.data);

    const posts = await Post.$get();

    expect(posts).toEqual(getPostsEmbed.data);
  });

  test('$get() hits right resource with "data" wrapper (nested object)', async () => {
    axiosMock.onGet().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual('http://localhost/posts/1/comments');

      return [200, getCommentsEmbed];
    });

    const post = new Post({ id: 1 });
    const comments = await post.comments().$get();

    for (const comment of comments) {
      expect(comment).toBeInstanceOf(Comment);
      for (const reply of (comment.replies as unknown as { data: Comment[] }).data) {
        expect(reply).toBeInstanceOf(Comment);
      }
    }
  });

  test('$get() hits right resource (nested object, custom PK)', async () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post({ id: 1, someId: 'po996-9dd18' }) as Post & { someId: string };

    axiosMock.onGet().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}/comments`);

      return [200, getComments];
    });

    const comments = await post.comments().$get();

    for (const comment of comments) {
      expect(comment).toBeInstanceOf(Comment);
      for (const reply of comment.replies) {
        expect(reply).toBeInstanceOf(Comment);
      }
    }
  });

  test('all() method should be an alias of get() method', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, getPosts);

    const postsAll = await Post.all();
    const postsGet = await Post.get();

    expect(postsAll).toStrictEqual(postsGet);
  });

  test('$all() method should be an alias of $get() method', async () => {
    axiosMock.onGet('http://localhost/posts').reply(200, getPostsEmbed);

    const postsAll = await Post.$all();
    const postsGet = await Post.$get();

    expect(postsAll).toStrictEqual(postsGet);
  });

  test('save() method makes a POST request when ID of object does not exists', async () => {
    let post: Post = new Post({ title: 'Cool!' });
    const _postResponse = {
      id: 1,
      title: 'Cool!',
      text: 'Lorem Ipsum Dolor',
      user: {
        firstname: 'John',
        lastname: 'Doe',
        age: 25,
      },
      relationships: {
        tags: [
          {
            name: 'super',
          },
          {
            name: 'awesome',
          },
        ],
      },
    };

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('post');
      expect(config.data).toEqual(JSON.stringify(post));
      expect(config.url).toEqual('http://localhost/posts');

      return [200, _postResponse];
    });

    post = await post.save();

    expect(post).toEqual(_postResponse);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('save() method makes a PUT request when ID of object exists', async () => {
    const post: Post = new Post({ id: 1, title: 'Cool!' });

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('put');
      expect(config.data).toEqual(JSON.stringify(post));
      expect(config.url).toEqual('http://localhost/posts/1');

      return [200, {}];
    });

    await post.save();
  });

  test('save() method makes a PUT request when ID of object exists (custom PK)', async () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post({ id: 1, someId: 'xs911-8cf12', title: 'Cool!' }) as Post & {
      someId: string;
    };

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('put');
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}`);
      expect(config.data).toEqual(JSON.stringify(post));

      return [200, {}];
    });

    await post.save();
  });

  test('save() method makes a PUT request when ID of object exists (nested object)', async () => {
    let comment: Comment & { text: string };

    axiosMock.onGet('http://localhost/posts/1/comments').reply(200, getComments);

    axiosMock.onPut().reply((config) => {
      expect(config.method).toEqual('put');
      expect(config.data).toEqual(JSON.stringify(comment));
      expect(config.url).toEqual('http://localhost/posts/1/comments/1');

      return [200, {}];
    });

    const post = new Post({ id: 1 });
    comment = (await post.comments().first()) as Comment & { text: string };
    comment.text = 'Owh!';
    comment = await comment.save();
  });

  test('save() method makes a PUT request when ID of object exists (nested object, customPK)', async () => {
    let comment: Comment & { text: string };

    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post({ id: 1, someId: 'xs911-8cf12', title: 'Cool!' }) as Post & {
      someId: string;
    };

    axiosMock.onGet(`http://localhost/posts/${post.someId}/comments`).reply(200, getComments);

    axiosMock.onPut().reply((config) => {
      expect(config.method).toEqual('put');
      expect(config.data).toEqual(JSON.stringify(comment));
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}/comments/1`);

      return [200, {}];
    });

    comment = (await post.comments().first()) as Comment & { text: string };
    comment.text = 'Owh!';
    comment = await comment.save();
  });

  test('save() method makes a PATCH request when method is set using `config`', async () => {
    const post = new Post({ id: 1, title: 'Cool!' });

    axiosMock.onAny().reply((config) => {
      const _post = post;

      expect(config.method).toEqual('patch');
      expect(config.data).toEqual(JSON.stringify(_post));
      expect(config.url).toEqual('http://localhost/posts/1');

      return [200, {}];
    });

    await post.config({ method: 'PATCH' }).save();
  });

  test('save() method makes a POST request when ID of object does not exists, even when `config` set to PATCH', async () => {
    let post: Post;
    const _postResponse = {
      id: 1,
      title: 'Cool!',
      text: 'Lorem Ipsum Dolor',
      user: {
        firstname: 'John',
        lastname: 'Doe',
        age: 25,
      },
      relationships: {
        tags: [
          {
            name: 'super',
          },
          {
            name: 'awesome',
          },
        ],
      },
    };

    axiosMock.onAny().reply((config) => {
      const _post = post;

      expect(config.method).toEqual('post');
      expect(config.data).toEqual(JSON.stringify(_post));
      expect(config.url).toEqual('http://localhost/posts');

      return [200, _postResponse];
    });

    post = new Post({ title: 'Cool!' });
    post = await post.config({ method: 'PATCH' }).save();

    expect(post).toEqual(_postResponse);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('save() method makes a POST request when ID of object does not exists, with header "Content-Type: multipart/form-data" if the data has files', async () => {
    let post: Post;
    const file = new File(['foo'], 'foo.txt', {
      type: 'text/plain',
    });
    const _postResponse = {
      id: 1,
      title: 'Cool!',
    };

    axiosMock.onAny().reply((config) => {
      let _data: Record<string, unknown> | string;

      if (config.headers!['Content-Type'] === 'multipart/form-data') {
        _data = Object.fromEntries(config.data as Iterable<readonly unknown[]>) as Record<
          string,
          unknown
        >;

        if (_data['files[]']) {
          _data.files = [{}, {}];
          delete _data['files[]'];
        }

        _data = JSON.stringify(_data);
      } else {
        _data = config.data as Record<string, unknown>;
      }

      expect(config.method).toEqual('post');
      expect(config.headers!['Content-Type']).toEqual('multipart/form-data');
      expect(_data).toEqual(JSON.stringify(post));
      expect(config.url).toEqual('http://localhost/posts');

      return [200, _postResponse];
    });

    // Single files
    post = new Post({ title: 'Cool!', file });
    await post.save();

    // Multiple files
    post = new Post({ title: 'Cool!', files: [file, file] });
    await post.save();
  });

  test('save() method makes a PUT request when ID of when ID of object exists, with header "Content-Type: multipart/form-data" if the data has files', async () => {
    let post: Post;
    const file = new File(['foo'], 'foo.txt', {
      type: 'text/plain',
    });
    const _postResponse = {
      id: 1,
      title: 'Cool!',
    };

    axiosMock.onAny().reply((config) => {
      let _data: Record<string, unknown> | string;

      if (config.headers!['Content-Type'] === 'multipart/form-data') {
        _data = Object.fromEntries(config.data as Iterable<readonly unknown[]>) as Record<
          string,
          unknown
        >;
        _data.id = 1;

        if (_data['files[]']) {
          _data.files = [{}, {}];
          delete _data['files[]'];
        }

        _data = JSON.stringify(_data);
      } else {
        _data = config.data as Record<string, unknown>;
      }

      expect(config.method).toEqual('put');
      expect(config.headers!['Content-Type']).toEqual('multipart/form-data');
      expect(_data).toEqual(JSON.stringify(post));
      expect(config.url).toEqual('http://localhost/posts/1');

      return [200, _postResponse];
    });

    // Single file
    post = new Post({ id: 1, title: 'Cool!', file });
    await post.save();

    // Multiple files
    post = new Post({ id: 1, title: 'Cool!', files: [file, file] });
    await post.save();
  });

  test('patch() method makes a PATCH request when ID of when ID of object exists, with header "Content-Type: multipart/form-data" if the data has files', async () => {
    let post: Post;
    const file = new File(['foo'], 'foo.txt', {
      type: 'text/plain',
    });
    const _postResponse = {
      id: 1,
      title: 'Cool!',
    };

    axiosMock.onAny().reply((config) => {
      let _data;

      if (config.headers!['Content-Type'] === 'multipart/form-data') {
        _data = Object.fromEntries(config.data as Iterable<readonly unknown[]>) as Record<
          string,
          unknown
        >;

        const configMethod = _data['_config[method]'];
        delete _data['_config[method]'];
        _data.id = 1;

        if (_data['files[]']) {
          _data.files = [{}, {}];
          delete _data['files[]'];
        }

        _data = JSON.stringify({
          _config: { method: configMethod },
          ..._data,
        });
      } else {
        _data = config.data as Record<string, unknown>;
      }

      expect(config.method).toEqual('patch');
      expect(config.headers!['Content-Type']).toEqual('multipart/form-data');
      expect(_data).toEqual(JSON.stringify(post));
      expect(config.url).toEqual('http://localhost/posts/1');

      return [200, _postResponse];
    });

    // Single file
    post = new Post({ id: 1, title: 'Cool!', file });
    await post.patch();

    // Multiple files
    post = new Post({ id: 1, title: 'Cool!', files: [file, file] });
    await post.patch();
  });

  test('save() method can add header "Content-Type: multipart/form-data" when "headers" object is already defined', async () => {
    let post: Post;
    const file = new File(['foo'], 'foo.txt', {
      type: 'text/plain',
    });
    const _postResponse = {
      id: 1,
      title: 'Cool!',
      text: 'Lorem Ipsum Dolor',
      user: {
        firstname: 'John',
        lastname: 'Doe',
        age: 25,
      },
      relationships: {
        tags: [
          {
            name: 'super',
          },
          {
            name: 'awesome',
          },
        ],
      },
    };

    axiosMock.onAny().reply((config) => {
      const _post = post;
      const _data =
        config.headers!['Content-Type'] === 'multipart/form-data'
          ? JSON.stringify(
              Object.fromEntries(config.data as Iterable<readonly unknown[]>) as Record<
                string,
                unknown
              >,
            )
          : (config.data as Record<string, unknown>);

      expect(config.method).toEqual('post');
      expect(config.headers!['Content-Type']).toStrictEqual('multipart/form-data');
      expect(config.url).toEqual('http://localhost/posts');

      return [200, _postResponse];
    });

    post = new Post({ title: 'Cool!', file });
    post = await post.config({ headers: {} }).save();

    expect(post).toEqual(_postResponse);
    expect(post).toBeInstanceOf(Post);
    expect(post.user).toBeInstanceOf(User);
    for (const tag of post.relationships.tags) {
      expect(tag).toBeInstanceOf(Tag);
    }
  });

  test('save() method makes a POST request when ID of object is null', async () => {
    let post: Post;

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('post');
      expect(config.data).toEqual(JSON.stringify(post));
      expect(config.url).toEqual('http://localhost/posts');

      return [200, {}];
    });

    post = new Post({ id: null, title: 'Cool!' });
    post = await post.save();
  });

  test('a request from delete() method hits the right resource', async () => {
    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('delete');
      expect(config.url).toBe('http://localhost/posts/1');

      return [200, {}];
    });

    const post = new Post({ id: 1 });

    await post.delete();
  });

  test('a request from delete() method hits the right resource (custom PK)', async () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post({ id: 1, someId: 'xs911-8cf12', title: 'Cool!' }) as Post & {
      someId: string;
    };

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('delete');
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}`);

      return [200, {}];
    });

    await post.delete();
  });

  test('a request from delete() method when model has not ID throws a exception', async () => {
    const errorModel = async (): Promise<void> => {
      const post = new Post();
      await post.delete();
    };

    await expect(errorModel).rejects.toThrow('This model has a empty ID.');
  });

  test('a request from delete() method hits the right resource (nested object)', async () => {
    axiosMock.onGet('http://localhost/posts/1/comments').reply(200, getComments);

    axiosMock.onDelete().reply((config) => {
      expect(config.method).toEqual('delete');
      expect(config.url).toBe('http://localhost/posts/1/comments/1');

      return [200, {}];
    });

    const post = new Post({ id: 1 });
    const comment = (await post.comments().first()) as Comment;
    await comment.delete();
  });

  test('a request from delete() method hits the right resource (nested object) (nested object, customPK)', async () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const post = new Post({ id: 1, someId: 'xs911-8cf12', title: 'Cool!' }) as Post & {
      someId: string;
    };

    axiosMock.onGet(`http://localhost/posts/${post.someId}/comments`).reply(200, getComments);

    axiosMock.onDelete().reply((config) => {
      expect(config.method).toEqual('delete');
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}/comments/1`);

      return [200, {}];
    });

    const comment = (await post.comments().first()) as Comment;
    await comment.delete();
  });

  test('a request with custom() method hits the right resource', async () => {
    axiosMock.onAny().reply((config) => {
      expect(config.url).toEqual(`http://localhost/postz`);

      return [200, {}];
    });

    await Post.custom('postz').first();
  });

  test('custom() gracefully handles accidental / for string arguments', async () => {
    axiosMock.onAny().reply((config) => {
      expect(config.url).toBe('http://localhost/postz/recent');

      return [200, {}];
    });

    await Post.custom('/postz', 'recent').first();
  });

  test('custom() called with multiple objects/strings gets the correct resource', async () => {
    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual('http://localhost/users/1/postz/comments');

      return [200, {}];
    });

    const user = new User({ id: 1 });
    const comment = new Comment();
    await Comment.custom(user, 'postz', comment).get();
  });

  test('a request from hasMany() method hits right resource', async () => {
    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual('http://localhost/users/1/posts');

      return [200, {}];
    });

    const user = new User({ id: 1 });
    await user.posts().get();
  });

  test('a request from hasMany() with a find() hits right resource', async () => {
    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('get');
      expect(config.url).toEqual('http://localhost/users/1/posts/1');
      return [200, {}];
    });

    const user = new User({ id: 1 });
    await user.posts().find(1);
  });

  test('a request hasMany() method returns a array of Models', async () => {
    axiosMock.onGet('http://localhost/users/1/posts').reply(200, getPosts);

    const user = new User({ id: 1 });
    const posts = (await user.posts().get()) as Post[];

    for (const post of posts) {
      expect(post).toBeInstanceOf(Post);
    }
  });

  test('attach() method hits right endpoint with a POST request', async () => {
    const commentData = { text: 'hi!' };

    axiosMock.onPost().reply((config) => {
      expect(config.method).toEqual('post');
      expect(config.data).toEqual(JSON.stringify(commentData));
      expect(config.url).toEqual('http://localhost/posts/1/comments');

      return [200, {}];
    });

    const post = new Post({ id: 1 });
    await post.comments().attach(commentData);
  });

  test('attach() method hits right endpoint with a POST request (custom PK)', async () => {
    Post.prototype.primaryKey = () => {
      return 'someId';
    };

    const commentData = { text: 'hi!' };
    const post = new Post({ id: 1, someId: 'gt123-9gh23' }) as Post & { someId: string };

    axiosMock.onPost().reply((config) => {
      expect(config.method).toEqual('post');
      expect(config.data).toEqual(JSON.stringify(commentData));
      expect(config.url).toEqual(`http://localhost/posts/${post.someId}/comments`);

      return [200, {}];
    });

    await post.comments().attach(commentData);
  });

  test('sync() method hits right endpoint with a PUT request', async () => {
    const commentData = { text: 'hi!' };

    axiosMock.onPut().reply((config) => {
      expect(config.method).toEqual('put');
      expect(config.data).toEqual(JSON.stringify(commentData));
      expect(config.url).toEqual('http://localhost/posts/1/comments');

      return [200, {}];
    });

    const post = new Post({ id: 1 });
    await post.comments().sync(commentData);
  });

  test('for() method setup the right resource', async () => {
    axiosMock.onPost().reply((config) => {
      expect(config.method).toEqual('post');
      expect(config.url).toEqual('http://localhost/users/1/posts');

      return [200, {}];
    });

    const user = new User({ id: 1 });

    const post = new Post({ text: 'Hello' }).for(user);
    await post.save();
  });

  test('Calling for() with multiple arguments productes the correct URL', () => {
    const user = new User({ id: 1 });
    const post = new Post({ id: 2 });
    const comment = new Comment({
      post_id: 2,
      text: 'for() takes more than one argument now!',
    }).for(user, post);

    expect(comment.endpoint()).toEqual(
      `http://localhost/users/${user.id}/posts/${post.id}/comments`,
    );
  });

  test('it throws a error when for() method does not recieve a instance of Model', () => {
    let errorModel: () => void;

    errorModel = (): void => {
      new Post({ text: 'Hello' }).for();
    };

    expect(errorModel).toThrow('The for() method takes a minimum of one argument.');

    errorModel = () => {
      new Post({ text: 'Hello' }).for({} as Post);
    };

    expect(errorModel).toThrow('The object referenced on for() method is not a valid Model.');

    errorModel = () => {
      new Post({ text: 'Hello' }).for('' as unknown as Post);
    };

    expect(errorModel).toThrow('The object referenced on for() method is not a valid Model.');

    errorModel = () => {
      new Post({ text: 'Hello' }).for(1 as unknown as Post);
    };

    expect(errorModel).toThrow('The object referenced on for() method is not a valid Model.');
  });

  test('it throws a error when for() when referenced object has not a valid id', () => {
    const errorModel = (): void => {
      const user = new User({ name: 'Mary' });
      new Post({ text: 'Hello' }).for(user);
    };

    expect(errorModel).toThrow('The object referenced on for() method has an invalid id.');
  });

  test('it throws a error when a custom() parameter is not a valid Model or a string', () => {
    let errorModel: () => void;

    errorModel = () => {
      new Post({ text: 'Hello' }).custom();
    };

    expect(errorModel).toThrow('The custom() method takes a minimum of one argument.');

    errorModel = () => {
      const user = new User({ name: 'Mary' });
      new Post({ text: 'Hello' }).custom(user, 'a-string', 42 as unknown as string);
    };

    expect(errorModel).toThrow('Arguments to custom() must be strings or instances of Model.');
  });

  test('it throws an error when CRUD and relationship operations are used in conjunction with custom()', async () => {
    let errorModel: () => Promise<unknown>;

    errorModel = async () => {
      await new Post({ text: 'Hello' }).custom('foo/bar').save();
    };

    await expect(errorModel).rejects.toThrow(
      'The save() method cannot be used in conjunction with the custom() method. Use for() instead.',
    );

    errorModel = async () => {
      await new Post({ id: 1 }).custom('foo/bar').delete();
    };

    await expect(errorModel).rejects.toThrow(
      'The delete() method cannot be used in conjunction with the custom() method. Use for() instead.',
    );

    errorModel = async () => {
      const post = new Post({ id: 1 });
      await post.comments().custom('foo/bar').attach({
        text: 'Awesome post!',
      });
    };

    await expect(errorModel).rejects.toThrow(
      'The attach() method cannot be used in conjunction with the custom() method. Use for() instead.',
    );

    errorModel = async () => {
      const post = new Post({ id: 1 });
      await post.comments().custom('foo/bar').sync({
        text: 'Awesome post!',
      });
    };

    await expect(errorModel).rejects.toThrow(
      'The sync() method cannot be used in conjunction with the custom() method. Use for() instead.',
    );
  });

  test('save() method makes a PUT request to the correct URL on nested object thas was fetched with find() method', async () => {
    axiosMock.onGet('http://localhost/posts/1/comments/1').reply(200, getComments[0]);
    axiosMock.onPut('http://localhost/posts/1/comments/1').reply(200, getComments[0]);

    const post = new Post({ id: 1 });
    const comment = (await post.comments().find(1)) as Comment & { text: string };

    axiosMock.onAny().reply((config) => {
      expect(config.method).toEqual('put');
      expect(config.url).toEqual('http://localhost/posts/1/comments/1');

      return [200, {}];
    });

    comment.text = 'Hola!';
    await comment.save();
  });

  test('config() method can change request config', async () => {
    axiosMock.onGet('http://localhost/posts').reply((config) => {
      expect(config.params).toEqual({
        foo: 'bar',
      });

      return [200, getPosts];
    });

    const posts = (await Post.config({
      params: {
        foo: 'bar',
      },
    }).get()) as Post[];

    for (const post of posts) {
      expect(post).toBeInstanceOf(Post);
      expect(post.user).toBeInstanceOf(User);
      for (const tag of post.relationships.tags) {
        expect(tag).toBeInstanceOf(Tag);
      }
    }
  });

  test('config() method can merge request config recursively', async () => {
    axiosMock.onAny().reply((config) => {
      const _post = { foo: 'bar' };
      expect(config.data).toEqual(JSON.stringify(_post));

      return [200, {}];
    });

    const post = new Post({ id: 1, title: 'Cool!' });
    await post
      .config({
        data: {
          foo: 'bar',
        },
      })
      .save();
  });
});
