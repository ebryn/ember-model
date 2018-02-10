var attr = Ember.attr;

QUnit.module("Ember.HasManyArray - non embedded objects saving");

QUnit.test("new records should remain after parent is saved", function(assert) {
  assert.expect(3);
  var json = {
    id: 1,
    title: 'foo',
    comment_ids: []
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';

  var Article = Ember.Model.extend({
    id: attr(),
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comment_ids' })
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';
  Article.adapter._ajax = function() {
    return new Ember.RSVP.Promise(function(resolve) {
        resolve(json);
    });
  };

  var article = Article.create({
    title: 'bar'
  });

  var comment = Comment.create({
    text: 'comment text'
  });

  article.get('comments').addObject(comment);

  var promise = Ember.run(article, article.save);
  var done = assert.async();
  promise.then(function(record) {
    assert.ok(record.get('comments.firstObject') === comment, "Comment is the same object");
    assert.equal(record.get('comments.length'), 1, "Article should still have one comment after save");
    assert.equal(record.get('comments.firstObject.text'), comment.get('text'), 'Comment is the same');
    done();
  });
});

QUnit.test("saving child objects", function(assert) {
  assert.expect(1);

  var commentJSON = {
    id: 2,
    title: 'bar',
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';
  Comment.adapter._ajax = function() {
    return new Ember.RSVP.Promise(function(resolve) {
        resolve(commentJSON);
    });
  };

  var Article = Ember.Model.extend({
    id: attr(),
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comment_ids' })
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';

  var article = Article.create();
  var comment = Comment.create();

  var comments = article.get("comments");
  comments.addObject(comment);

  var promise = Ember.run(comments, comments.save);
  var done = assert.async();
  promise.then(function(records) {
    var comment = records.get('firstObject');
    assert.equal(comment.get("id"), 2, "Data from the response is loaded");
    done();
  }).catch(function(error) {
    console.error(error);
  });
});
