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
  deepEqual(Ember.run(comments, comments.mapProperty, 'text'), ['uno', 'dos', 'tres']);
  ok(!comments.everyProperty('isNew'), "Records should not be new");
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