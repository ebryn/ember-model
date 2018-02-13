var attr = Ember.attr;

QUnit.module("Ember.HasManyArray - manipulation");


QUnit.test('objectAtContent returns the element in the given index', function(assert) {
   var json = {
    id: 1,
    title: 'foo',
    comments: [1, 2]
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
  ];

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  assert.equal(article.get('comments.length'), 2, 'has two elements');
  assert.equal(article.get('comments').objectAt(1).get('id'), 2, 'returns the right element');
});


QUnit.test('objectAtContent returns undefined when there\'s no content', function(assert) {
   var json = {
    id: 1,
    title: 'foo',
    comments: []
  };

  var Comment = Ember.Model.extend({
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments' })
  });

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  assert.equal(article.get('comments.length'), 0, 'has no elements');
  assert.equal(article.get('comments').objectAt(1), undefined, 'returns undefined');
});


QUnit.test('objectAtContent returns undefined for an out of bounds index', function(assert) {
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
    {id: 1, text: 'uno'}
  ];

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);

  assert.equal(article.get('comments.length'), 1, 'has one element');
  assert.equal(article.get('comments').objectAt(1), undefined, 'returns undefined');
});

QUnit.test("pushing record without an id adds a reference to the content", function(assert) {
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
  assert.equal(comments.get('length'), 4);
  assert.equal(content[3].record, comment, "content should contain reference with added object");
  assert.ok(!content[3].id, "id should in the reference should be empty");
});

QUnit.test('adding and reverting an existing record to a many array', function(assert) {
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

  assert.equal(article.get('comments.length'), 1, 'should have 1 comment');
  assert.equal(article.get('isDirty'), false, 'should not be dirty');

  var c = Comment.find(1);
  // Why is this new by default?
  c.set('isNew', false);
  article.get('comments').pushObject(c);

  assert.equal(article.get('comments.length'), 2, 'should included added comment');
  assert.equal(article.get('isDirty'), true, 'should now be dirty');

  article.revert();

  assert.equal(article.get('comments.length'), 1, 'show now go back to 1 comment');
  assert.equal(article.get('isDirty'), false, 'should no longer be dirty');
});

QUnit.test('adding and reverting a new record to a many array', function(assert) {
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

  assert.equal(article.get('comments.length'), 1, 'should have 1 comment');
  assert.equal(article.get('isDirty'), false, 'should not be dirty');

  var newComment = Comment.create({id: 4, text: 'quatro', isNew: true});
  article.get('comments').pushObject(newComment);

  assert.equal(article.get('comments.length'), 2, 'should included added comment');
  assert.equal(article.get('isDirty'), true, 'should now be dirty');

  article.revert();

  assert.equal(article.get('comments.length'), 1, 'show now go back to 1 comment');
  assert.equal(article.get('isDirty'), false, 'should no longer be dirty');
});

QUnit.test("removing a record from the many array", function(assert) {
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

  assert.equal(comments.get('length'), 2, "There are now only two items in the array");
  assert.equal(comments.objectAt(0).get('id'), 1, "The first element is correct");
  assert.equal(comments.objectAt(1).get('id'), 3, "The second element is correct");

  article.revert();

  assert.equal(article.get('isDirty'), false, "article should not be dirty after revert");
});

QUnit.test("setting a has many array with empty array", function(assert) {
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

  assert.equal(article.get('comments.length'), 3, "should be 3 comments");

  article.set('comments', []);
  assert.equal(article.get('comments.length'), 0, "should be 0 comments after set");
  assert.equal(article.get('comments.isDirty'), true, "comments should be dirty after set");

  article.revert();

  assert.equal(article.get('comments.length'), 3, "should be 3 comments after revert");
  assert.equal(article.get('comments.isDirty'), false, "should not be dirty after revert");
});

QUnit.test("setting a has many array with item array", function(assert) {
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

  assert.equal(article.get('comments.length'), 3, "should be 3 comments");

  article.set('comments', [Comment.find(3)]);
  assert.equal(article.get('comments.length'), 1, "should be 1 comment after set");
  assert.equal(article.get('comments.isDirty'), true, "comments should be dirty after set");

  article.revert();

  assert.equal(article.get('comments.length'), 3, "should be 3 comments after revert");
  assert.equal(article.get('comments.isDirty'), false, "should not be dirty after revert");
});

QUnit.test("setting a hasMany array with setObjects", function(assert) {
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

  assert.equal(article.get('comments.length'), 3, "should be 3 comments");

  article.get('comments').setObjects([Comment.find(3)]);
  assert.equal(article.get('comments.length'), 1, "should be 1 comment after set");
  assert.equal(article.get('comments.isDirty'), true, "comments should be dirty after set");

  article.revert();

  assert.equal(article.get('comments.length'), 3, "should be 3 comments after revert");
  assert.equal(article.get('comments.isDirty'), false, "should not be dirty after revert");
});