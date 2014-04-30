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

  var comment = Comment.create({id: 4, text: "quatro"});
  article.get('comments').pushObject(comment);

  equal(article.get('isDirty'), true);
  article.set('_dirtyAttributes', []);
  equal(article.get('isDirty'), false, "clearning out dirty attributes should make the article clean again");

  comments.removeObject(comment);
  equal(article.get('comments.length'), 3, "removing an object should succeed");
  equal(article.get('isDirty'), true, "removing an object in an embedded has many array should dirty the model");

});
