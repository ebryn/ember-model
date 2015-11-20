var attr = Ember.attr;

module("Ember.HasManyArray - submodels");

test("Can load .getRelationship() for hasMany", function() {
  expect(4);

  var json = {
    id: 1,
    title: 'foo',
    comments: [1, 2, 3]
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr(),
    color: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments' })
  });

  Comment.adapter = Ember.FixtureAdapter.create();
  Comment.FIXTURES = [
    {id: 1, text: 'uno', color: 'red'},
    {id: 2, text: 'dos', color: 'green'},
    {id: 3, text: 'tres', color: 'blue'}
  ];

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.getRelationship('comments', {text: 1});  
  stop();
  var commentPromises = comments.toArray().map(function(c) { return Ember.loadPromise(c); });
  var promise = Ember.RSVP.all(commentPromises);
  promise.then(function() {
    start();
    equal(comments.get('length'), 3, "There are 3 comments");
    deepEqual(Ember.run(comments, comments.mapBy, 'text'), ['uno', 'dos', 'tres'], "The comments are loaded");
    ok(comments.isEvery('isSub'), "Records should be submodels");

    comments = article.get('comments');
    ok(comments.isEvery('isSub'), "Records should be submodels");
  });

});

test(".reload() on parent model causes relationship models to no longer be submodels", function() {
  var json = {
    id: 1,
    title: 'foo',
    comments: [1, 2, 3]
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr(),
    color: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments' })
  });

  Comment.adapter = Ember.FixtureAdapter.create();
  Comment.FIXTURES = [
    {id: 1, text: 'uno', color: 'red'},
    {id: 2, text: 'dos', color: 'green'},
    {id: 3, text: 'tres', color: 'blue'}
  ];

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.getRelationship('comments', {text: 1});  
  stop();
  var commentPromises = comments.toArray().map(function(c) { return Ember.loadPromise(c); });
  var promise = Ember.RSVP.all(commentPromises);
  promise.then(function() {
    start();
    Ember.run(article, article.load, json.id, json);
    comments = article.get('comments');
    commentPromises = comments.toArray().map(function(c) { return Ember.loadPromise(c); });
    promise = Ember.RSVP.all(commentPromises);
    stop();
    promise.then(function() {
      start();
      ok(!comments.isEvery('isSub'), "Records should NOT be submodels");
    });
  });
});