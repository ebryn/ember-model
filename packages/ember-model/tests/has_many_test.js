var get = Ember.get;

module("Ember.hasMany");

test("it exists", function() {
  ok(Ember.hasMany);
});

test("is a CP macro", function() {
  var Model = Ember.Model.extend(),
      cp = Ember.hasMany(Model, 'comments');

  ok(cp instanceof Ember.ComputedProperty);

  var comments = Ember.A([{}]),
      obj = {
        data: {comments: comments}
      },
      ret = cp.func.apply(obj, ["comments"]);

  ok(ret instanceof Ember.HasManyArray);
  equal(ret.get('modelClass'), Model);
  equal(ret.get('parent'), obj);
  deepEqual(ret.get('content'), comments);
});

test("using it in a model definition", function() {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, 'comments')
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  equal(article.get('comments.length'), 2);
  equal(Ember.run(article, article.get, 'comments.firstObject.token'), 'a');
});

test("model can be specified with a string instead of a class", function() {
  var Article = Ember.Model.extend({
        comments: Ember.hasMany('Ember.CommentModel', 'comments')
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
