var attr = Ember.attr;

module("Ember.HasManyArray - embedded objects saving");

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
    id: attr(),
    text: attr()
  });

  Comment.adapter = {
    createRecord: function(record) {
      Ember.run.later(function() {
        record.load(4, {text: 'quattro'});
        record.didCreateRecord();
      }, 1);

      return record;
    },

    saveRecord: function(record) {
      Ember.run.later(function() {
        record.didSaveRecord();
      }, 1);

      return record;
    }
  };

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments');
  var newComment = comments.create({text: 'quattro'});

  equal(comments.get('length'), 4);
  ok(newComment instanceof Comment);
  deepEqual(comments.mapProperty('text'), ['uno', 'dos', 'tres', 'quattro']);

  Ember.run(function() {
    stop();
    comments.save().then(function() {
      start();
      ok(!newComment.get('isDirty'), "New comment is not dirty");
      equal(newComment.get('id'), 4, "New comment has an ID");
    });
  });
});