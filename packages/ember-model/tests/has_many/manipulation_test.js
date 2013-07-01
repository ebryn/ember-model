var attr = Ember.attr;

module("Ember.HasManyArray - manipulation");

test("pushing record without an id adds a reference to the content", function() {
  var json = {
    id: 1,
    title: 'foo',
    comments: [1, 2, 3]
  };

  var Comment = Ember.Model.extend({
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
  Ember.run(article, article.load, json.id, json);

  var comments = article.get('comments');

  var comment = Comment.create({ text: 'quatro' });

  Ember.run(comments, comments.pushObject, comment);


  var content = comments.get('content');
  equal(comments.get('length'), 4);
  equal(content[3].record, comment, "content should contain reference with added object");
  ok(!content[3].id, "id should in the reference should be empty");
});
