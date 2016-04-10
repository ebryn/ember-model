var attr = Ember.attr;

module("Ember.EmbeddedHasManyArray - embedded objects loading");

test("derp", function() {
  var json = {
    id: 1,
    title: 'foo',
    comments: [
      {id: 1, text: 'uno'},
      {id: 2, text: 'dos'},
      // ensure that records without an id work correctly
      {text: 'tres'}
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

  equal(comments.get('length'), 3);
  ok(Ember.run(comments, comments.get, 'firstObject') instanceof Comment);
  deepEqual(Ember.run(comments, comments.mapBy, 'text'), ['uno', 'dos', 'tres']);
  ok(!comments.isEvery('isNew'), "Records should not be new");
});

test("loading embedded data into a parent updates the child records", function() {
  expect(2);

  var json = {
    id: 1,
    comments: [
      {id: 1, body: 'new'}
    ]
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    body: attr()
  });

  Comment.adapter = {
    find: function(record, id) {
      record.load(id, {body: 'old'});
    }
  };

  var Post = Ember.Model.extend({
    id: attr(),
    comments: Ember.hasMany(Comment, {key: 'comments', embedded: true})
  });

  Post.adapter = {
    find: function(record, id) {
      record.load(id, {comments: []});
    }
  };

  var comment = Comment.find(1);
  equal(comment.get('body'), 'old');

  var post = Post.find(1);
  post.load(1, json);

  equal(comment.get('body'), 'new');
});

test("loading embedded data into a parent with deleted children deletes the children", function() {
  expect(2);

  var Comment = Ember.Model.extend({
    id: attr(),
    body: attr()
  });

  var Post = Ember.Model.extend({
    id: attr(),
    comments: Ember.hasMany(Comment, {key: 'comments', embedded: true})
  });

  Post.adapter = {
    find: function(record, id) {
      record.load(id, {comments: []});
    }
  };

  var post = Post.find(1);
  var comment = Comment.create();
  post.get('comments').pushObject(comment);

  var json = {
    id: 1,
    comments: [
      {id: 1, body: 'new'}
    ]
  };

  // deletes all children and load new ones.
  post.get('comments').forEach(function(comment) {
    comment.didDeleteRecord();
  });
  post.load(1, json);

  equal(post.get('comments.length'), 1);
  equal(post.get('comments.firstObject.body'), 'new');
});

test("loading collections with same element twice does not trigger observers", function() {
  expect(4);
  var json = {
    id: 1,
    title: 'foo',
    comments: [{
      id: 1,
      text: 'helo'
    }]
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';

  var Article = Ember.Model.extend({
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true }),

    commentsChangeCounter: 0,
    commentsChanged: function() {
      this.incrementProperty('commentsChangeCounter');
    }.observes('comments.[]')
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';
  Article.adapter._ajax = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      resolve(json);
    });
  };

  var article = Article.create();
  Ember.run(article, article.load, json.id, json);
  // Force collection to be taken into account (_registerHasManyArray)
  var comments = article.get('comments');
  equal(article.get('commentsChangeCounter'), 0, "Inital load didn't triggered observers");
  var json2 = {
    id: 1,
    title: 'foo',
    comments: [{
      id: 1,
      text: 'helo here' // <- updated
    }]
  };
  Ember.run(article, article.load, json.id, json2);
  equal(article.get('commentsChangeCounter'), 0, "Load with the same collection didn't triggered observers");
  equal(comments.get('isDirty'), false, "comments should not be dirty");
  deepEqual(Ember.run(comments, comments.mapBy, 'text'), ['helo here']);
});
