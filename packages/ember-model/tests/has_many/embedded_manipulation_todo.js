var attr = Ember.attr;

QUnit.module("Ember.EmbeddedHasManyArray - manipulation");

QUnit.test("pushing record adds a record to many array", function(assert) {
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
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments');

  var comment = Comment.create({ text: 'quatro' });

  Ember.run(comments, comments.pushObject, comment);

  assert.equal(comments.get('length'), 4);
  assert.equal(comments.get('lastObject.text'), 'quatro', 'added element should be available in the array');

  comment = Comment.create({ id: 5, text: 'cinco' });

  Ember.run(comments, comments.pushObject, comment);

  assert.equal(comments.get('length'), 5);
  assert.equal(comments.get('lastObject.text'), 'cinco', 'added element should be available in the array');
});

QUnit.test("removing a record from the many array", function(assert) {
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
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments'),
      dos = comments.objectAt(1);

  comments.removeObject(dos);

  assert.equal(comments.get('length'), 2, "There are now only two items in the array");
  assert.equal(comments.objectAt(0).get('text'), "uno", "The first element is correct");
  assert.equal(comments.objectAt(1).get('text'), "tres", "The second element is correct");
});