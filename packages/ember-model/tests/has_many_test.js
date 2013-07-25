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

test("materializing the relationship should should not dirty the record", function() {
  expect(2);

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
});
