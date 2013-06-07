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
  var Comment = Ember.Model.extend(),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, 'comments')
      });

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{id: 1}, {id: 2}])});

  equal(article.get('comments.length'), 2);
});