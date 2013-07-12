var attr = Ember.attr;

module("Ember.EmbeddedHasManyArray - manipulation");

test("pushing record adds a record to many array", function() {
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

  equal(comments.get('length'), 4);
  equal(comments.get('lastObject.text'), 'quatro', 'added element should be available in the array');

  comment = Comment.create({ id: 5, text: 'cinco' });

  Ember.run(comments, comments.pushObject, comment);

  equal(comments.get('length'), 5);
  equal(comments.get('lastObject.text'), 'cinco', 'added element should be available in the array');
});

test("removing a record from the many array", function() {
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

  equal(comments.get('length'), 2, "There are now only two items in the array");
  equal(comments.objectAt(0).get('text'), "uno", "The first element is correct");
  equal(comments.objectAt(1).get('text'), "tres", "The second element is correct");
});