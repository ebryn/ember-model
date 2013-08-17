var attr = Ember.attr;

module("Ember.EmbeddedHasManyArray - embedded objects saving");

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

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });

  Comment.adapter = {

    createRecord: function(record) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        Ember.run.later(function() {
          record.load(4, {text: 'quattro'});
          record.didCreateRecord();
          resolve(record);
        }, 1);
      });
    },

    saveRecord: function(record) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        Ember.run.later(function() {
          record.didSaveRecord();
          resolve(record);
        }, 1);
      });
    }
  };

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments');
  var newComment = Ember.run(comments, comments.create, {text: 'quattro'});

  equal(comments.get('length'), 4);
  ok(newComment instanceof Comment);
  deepEqual(Ember.run(comments, comments.mapProperty, 'text'), ['uno', 'dos', 'tres', 'quattro']);

  Ember.run(function() {
    stop();
    comments.save().then(function(record) {
      start();
      ok(!newComment.get('isDirty'), "New comment is not dirty");
      equal(newComment.get('id'), 4, "New comment has an ID");
    });
  });
});

test("new records should remain after parent is saved", function() {
  expect(3);
  var json = {
    id: 1,
    title: 'foo',
    comments: []
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';

  var Article = Ember.Model.extend({
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';
  Article.adapter._ajax = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      resolve(json);
    });
  };
  
  var article = Article.create({
    title: 'foo'
  });

  var comment = Comment.create({
    text: 'comment text'
  });
  article.get('comments').addObject(comment);
  var promise = Ember.run(article, article.save);
  promise.then(function(record) {
    start();
    ok(record.get('comments.firstObject') === comment, "Comment is the same object");
    equal(record.get('comments.length'), 1, "Article should still have one comment after save");
    equal(record.get('comments.firstObject.text'), comment.get('text'), 'Comment is the same');
  });
  stop();
});
