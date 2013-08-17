var get = Ember.get;

module("Ember.hasMany");

test("it exists", function() {
  ok(Ember.hasMany);
});

test("is a CP macro", function() {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      cp = Ember.hasMany(Comment, { key: 'comments', embedded: true }),
      Article = Ember.Model.extend({
        comments: cp
      });

  Comment.primaryKey = 'token';

  ok(cp instanceof Ember.ComputedProperty);

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});
  var comments = Ember.run(article, article.get, 'comments');

  ok(comments instanceof Ember.EmbeddedHasManyArray);
  equal(comments.get('modelClass'), Comment);
  equal(comments.get('parent'), article);
});

test("creates Ember.HasManyArray if embedded is set to false", function() {
var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      cp = Ember.hasMany(Comment, { key: 'comments' }),
      Article = Ember.Model.extend({
        comments: cp
      });

  Comment.primaryKey = 'token';

  ok(cp instanceof Ember.ComputedProperty);

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([1, 2])});
  var comments = Ember.run(article, article.get, 'comments');

  ok(comments instanceof Ember.HasManyArray);
  equal(comments.get('modelClass'), Comment);
  equal(comments.get('parent'), article);
});

test("using it in a model definition", function() {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  equal(article.get('comments.length'), 2);
  equal(Ember.run(article, article.get, 'comments.firstObject.token'), 'a');
});

test("model can be specified with a string instead of a class", function() {
  var Article = Ember.Model.extend({
      comments: Ember.hasMany('Ember.CommentModel', { key: 'comments', embedded: true })
      }),
      Comment = Ember.CommentModel = Ember.Model.extend({
        token: Ember.attr(String)
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  equal(article.get('comments.length'), 2);
  equal(Ember.run(article, article.get, 'comments.firstObject.token'), 'a');
});

test("when fetching an association getHasMany is called", function() {
  expect(4);

  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  article.getHasMany = function(key, type, meta) {
    equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    equal(type, Comment, "type of the association should be passed to getHasMany");
    equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return 'foobar';
  };

  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  equal(article.get('comments'), 'foobar', "value returned from getHasMany should be returned as an association");
});

test("toJSON uses the given relationship key", function() {
  expect(1);

  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comment_ids' })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  Ember.run(article, article.load, 1, { comment_ids: Ember.A(['a'] )});

  deepEqual(article.toJSON(), { comment_ids: ['a'] }, "Relationship ids should be serialized only under the given key");
});

test("materializing the relationship should not dirty the record", function() {
  expect(4);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Ember.run(Post, Post.create);
  post.get('id');
  ok(!post.get('isDirty'), 'is not dirty before materializing the relationship');
  post.get('authors');
  ok(!post.get('isDirty'), 'is not dirty after materializing the relationship');

  var postWithData = Post.create();
  postWithData.load(1, {author_ids: [2]});
  postWithData.get('id');
  ok(!postWithData.get('isDirty'), 'with data is not dirty before materializing the relationship');
  postWithData.get('authors');
  ok(!postWithData.get('isDirty'), 'with data is not dirty after materializing the relationship');
});

test("modifying a hasMany record should make parent dirty", function() {
  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var author = Author.create();
  var post = Post.create();

  Ember.run(function() {
    post.load(1, {id: 1, author_ids: [100]});
    author.load(100, {id: 100, name: 'bob'});
  });

  post.get('authors');
  ok(!post.get('isDirty'));
  author.set('name', 'billy');
  ok(post.get('isDirty'));
});

test("adding or removing from the hasMany array should make parent dirty", function() {
  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var author1 = Author.create();
  var author2 = Author.create();
  var post = Post.create();

  Ember.run(function() {
    author1.load(100, {id: 100, name: 'bob'});
    author2.load(200, {id: 200, name: 'mark'});
    post.load(1, {id: 1, author_ids: [100]});
  });

  post.get('authors');
  ok(!post.get('isDirty'));

  post.get('authors').pushObject(author2);
  ok(post.get('isDirty', 'adding new record to hasMany dirties the parent'));

  post.get('authors').removeObject(author2);
  ok(!post.get('isDirty'), 'restoring the hasMany array undirties the parent');

  post.get('authors').removeObject(author1);
  ok(post.get('isDirty', 'removing record from hasMany dirties the parent'));
});

test("reordering the hasMany array should not make parent dirty", function() {
  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var author1 = Author.create();
  var author2 = Author.create();
  var post = Post.create();

  Ember.run(function() {
    author1.load(100, {id: 100, name: 'bob'});
    author2.load(200, {id: 200, name: 'mark'});
    post.load(1, {id: 1, author_ids: [100, 200]});
  });

  var author = post.get('authors').popObject();
  post.get('authors').unshiftObject(author);
  ok(!post.get('isDirty'));
});

test("hasMany isDirty works for embedded arrays", function() {
  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'authors', embedded: true})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var author = Author.create();
  var post = Post.create();

  Ember.run(function() {
    author.load(200, {id: 200, name: 'mark'});
    post.load(1, {id: 1, authors: [{id: 100, name: 'bob'}]});
  });

  post.get('authors');
  ok(!post.get('isDirty'));

  post.get('authors').pushObject(author);
  ok(post.get('isDirty', 'adding new record to hasMany dirties the parent'));

  post.get('authors').removeObject(author);
  ok(!post.get('isDirty'), 'restoring the hasMany array undirties the parent');

  post.get('authors').popObject();
  ok(post.get('isDirty', 'removing record from hasMany dirties the parent'));
});
