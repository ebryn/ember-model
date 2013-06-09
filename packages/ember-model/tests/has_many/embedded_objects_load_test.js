var attr = Ember.attr;

module("Ember.HasManyArray - embedded objects loading");

test("derp", function() {
  var json = {
    id: 1,
    title: 'foo',
    comments: [
      {id: 1, text: 'uno'},
      {id: 2, text: 'dos'},
      {id: 3, text: 'tres'}
    ]
  };

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.computed(function(key) {
      return Ember.HasManyArray.create({
        parent: this,
        modelClass: Comment,
        content: Ember.A(this.get('data.comments'))
      });
    }).property()
  });

  var Comment = Ember.Model.extend({
    text: attr()
  });

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments');

  equal(comments.get('length'), 3);
  ok(Ember.run(comments, comments.get, 'firstObject') instanceof Comment);
  deepEqual(Ember.run(comments, comments.mapProperty, 'text'), ['uno', 'dos', 'tres']);
  ok(!comments.everyProperty('isNew'), "Records should not be new");
});