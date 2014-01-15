var Comment, Article, CommentServerAdapter;
module("Ember.HasManyArray - non embedded objects saving", {
  setup: function () {
    Comment = Ember.Model.extend({
      id: Ember.attr(),
      text: Ember.attr(),
      article: Ember.belongsTo('Article', { key: 'article_id' })
    });
    Comment.adapter = Ember.FixtureAdapter.create();
    Comment.FIXTURES = [];
    Article = Ember.Model.extend({
      id: Ember.attr(),
      title: Ember.attr(),
      comments: Ember.hasMany('Comment', { key: 'comment_ids' })
    });
    Article.adapter = Ember.FixtureAdapter.create();
    Article.FIXTURES = [];
    CommentServerAdapter = Ember.FixtureAdapter.extend({
      createRecord: function (record) {
        record.load(1, { id: 1, article_id: 1, text: record.get('text') });
        record.didCreateRecord();
        return new Ember.RSVP.Promise(function(resolve, reject) {
          resolve(record);
        });
      }
    });
  }
});

test("new records should remain after parent is saved", function() {
  expect(3);

  var article = Article.create({ title: 'bar' });
  var comment = Comment.create({ text: 'comment text' });

  article.get('comments').addObject(comment);
  article.save().then(function(record){
    start();
    ok(record.get('comments.firstObject') === comment, "Comment is the same object");
    equal(record.get('comments.length'), 1, "Article should still have one comment after save");
    equal(record.get('comments.firstObject.text'), comment.get('text'), 'Comment is the same');
  });
  stop();
});

test("new child records should be associated with the parent", function () {
  expect(1);

  var articleData = {
    id: 1,
    title: 'foo',
    comment_ids: []
  };

  var article = Article.create();
  Ember.run(article, article.load, articleData.id, articleData);

  Comment.adapter = CommentServerAdapter.create();

  Comment.create({ text: 'bar' }).save().then(function(comment){
    start();
    equal(comment.get('article').get('title'), 'foo');
  });
  stop();
});

test("a parent record should be associated with new child records", function () {
  expect(4);

  var articleData = {
    id: 1,
    title: 'foo',
    comment_ids: []
  };

  var article = Article.create();
  Ember.run(article, article.load, articleData.id, articleData);

  Comment.adapter = CommentServerAdapter.create();

  equal(article.get('comments.length'), 0);
  equal(article.get('comments.firstObject'), null);

  Comment.create({ text: 'bar' }).save().then(function(){
    start();
    equal(article.get('comments.length'), 1);
    equal(article.get('comments.firstObject').get('text'), 'bar');
  });
  stop();
});

test("a parent records _data should be updated with created child", function () {
  expect(2);

  var articleData = {
    id: 1,
    title: 'foo',
    comment_ids: []
  };

  var article = Article.create();
  Ember.run(article, article.load, articleData.id, articleData);

  Comment.adapter = CommentServerAdapter.create();

  equal(article.get('_data.comment_ids.length'), 0);

  Comment.create({ text: 'bar' }).save().then(function(){
    start();
    equal(article.get('_data.comment_ids.length'), 1);
  });
  stop();
});

test("a parent record should not be dirtied by a created child (nonembedded)", function () {
  expect(4);

  var articleData = {
    id: 1,
    title: 'foo',
    comment_ids: []
  };

  var article = Article.create();
  Ember.run(article, article.load, articleData.id, articleData);

  Comment.adapter = CommentServerAdapter.create();

  equal(article.get('isDirty'), false);
  equal(article.get('_dirtyAttributes.firstObject'), null);

  Comment.create({ text: 'bar' }).save().then(function(){
    start();
    equal(article.get('isDirty'), false);
    equal(article.get('_dirtyAttributes.firstObject'), null);
  });
  stop();
});