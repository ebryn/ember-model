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

test('adding and reverting an existing record to a many array', function () {
  var json = {
    id: 1,
    title: 'foo',
    comments: [1]
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

  equal(article.get('comments.length'), 1, 'should have 1 comment');
  equal(article.get('isDirty'), false, 'should not be dirty');

  var c = Comment.find(1);
  // Why is this new by default?
  c.set('isNew', false);
  article.get('comments').pushObject(c);

  equal(article.get('comments.length'), 2, 'should included added comment');
  equal(article.get('isDirty'), true, 'should now be dirty');

  article.revert();

  equal(article.get('comments.length'), 1, 'show now go back to 1 comment');
  equal(article.get('isDirty'), false, 'should no longer be dirty');
});

test('adding and reverting a new record to a many array', function () {
  var json = {
    id: 1,
    title: 'foo',
    comments: [1]
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

  equal(article.get('comments.length'), 1, 'should have 1 comment');
  equal(article.get('isDirty'), false, 'should not be dirty');

  var newComment = Comment.create({id: 4, text: 'quatro', isNew: true});
  article.get('comments').pushObject(newComment);

  equal(article.get('comments.length'), 2, 'should included added comment');
  equal(article.get('isDirty'), true, 'should now be dirty');

  article.revert();

  equal(article.get('comments.length'), 1, 'show now go back to 1 comment');
  equal(article.get('isDirty'), false, 'should no longer be dirty');
});

test("removing a record from the many array", function() {
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

  var comments = article.get('comments'),
      dos = comments.objectAt(1);

  comments.removeObject(dos);

  equal(comments.get('length'), 2, "There are now only two items in the array");
  equal(comments.objectAt(0).get('id'), 1, "The first element is correct");
  equal(comments.objectAt(1).get('id'), 3, "The second element is correct");

  article.revert();

  equal(article.get('isDirty'), false, "article should not be dirty after revert");
});

test("setting a has many array with empty array", function() {
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

  equal(article.get('comments.length'), 3, "should be 3 comments");

  article.set('comments', []);
  equal(article.get('comments.length'), 0, "should be 0 comments after set");
  equal(article.get('comments.isDirty'), true, "comments should be dirty after set");

  article.revert();

  equal(article.get('comments.length'), 3, "should be 3 comments after revert");
  equal(article.get('comments.isDirty'), false, "should not be dirty after revert");
});

test("setting a has many array with item array", function() {
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

  equal(article.get('comments.length'), 3, "should be 3 comments");

  article.set('comments', [Comment.find(3)]);
  equal(article.get('comments.length'), 1, "should be 1 comment after set");
  equal(article.get('comments.isDirty'), true, "comments should be dirty after set");

  article.revert();

  equal(article.get('comments.length'), 3, "should be 3 comments after revert");
  equal(article.get('comments.isDirty'), false, "should not be dirty after revert");
});

test("setting a hasMany array with setObjects", function() {
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

  equal(article.get('comments.length'), 3, "should be 3 comments");

  article.get('comments').setObjects([Comment.find(3)]);
  equal(article.get('comments.length'), 1, "should be 1 comment after set");
  equal(article.get('comments.isDirty'), true, "comments should be dirty after set");

  article.revert();

  equal(article.get('comments.length'), 3, "should be 3 comments after revert");
  equal(article.get('comments.isDirty'), false, "should not be dirty after revert");
});