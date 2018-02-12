var attr = Ember.attr;

QUnit.module("Ember.HasManyArray - objects loading");

QUnit.test("loads objects based on their ids", function(assert) {
  assert.expect(5);

  var json = {
    id: 1,
    title: 'foo',
    comments: [1, 2, 3]
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments' })
  });

  Comment.adapter = Ember.FixtureAdapter.create();
  Comment.FIXTURES = [
    {id: 1, text: 'uno'},
    {id: 2, text: 'dos'},
    {id: 3, text: 'tres'}
  ];

  var article = Article.create();
  var comments = article.get('comments');

  assert.equal(comments.get('length'), 0);

  Ember.run(article, article.load, json.id, json);

  var done = assert.async();
  var commentPromises = comments.toArray().map(function(c) { return Ember.loadPromise(c); });
  var promise = Ember.RSVP.all(commentPromises);
  promise.then(function() {
    assert.equal(comments.get('length'), 3, "There are 3 comments");
    assert.ok(Ember.run(comments, comments.get, 'firstObject') instanceof Comment, "The first object is a Comment object");
    assert.deepEqual(Ember.run(comments, comments.mapBy, 'text'), ['uno', 'dos', 'tres'], "The comments are loaded");
    assert.ok(!comments.isEvery('isNew'), "Records should not be new");
    done();
  });
});
