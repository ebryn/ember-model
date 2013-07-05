var attr = Ember.attr;

module("Ember.HasManyArray - objects loading");

test("loads objects based on their ids", function() {
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

  equal(comments.get('length'), 0);

  Ember.run(article, article.load, json.id, json);

  stop();
  var promise = Ember.RSVP.all(Ember.run(comments, comments.toArray));
  promise.then(function() {
    start();
    equal(comments.get('length'), 3);
    ok(Ember.run(comments, comments.get, 'firstObject') instanceof Comment);
    deepEqual(Ember.run(comments, comments.mapProperty, 'text'), ['uno', 'dos', 'tres']);
    ok(!comments.everyProperty('isNew'), "Records should not be new");
  });
});
