module("Ember.belongsTo");

test("it exists", function() {
  ok(Ember.belongsTo);
});

test("is a CP macro", function() {
  var Article = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      cp = Ember.belongsTo(Article, { key: 'article', embedded: true }),
      Comment = Ember.Model.extend({
        article: cp
      });

  ok(cp instanceof Ember.ComputedProperty);
});

test("using it in a model definition", function() {
  var Article = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      Comment = Ember.Model.extend({
        article: Ember.belongsTo(Article, { key: 'article', embedded: true })
      });

  Article.primaryKey = 'slug';

  var comment = Comment.create();
  Ember.run(comment, comment.load, 1, { article: { slug: 'first-article' } });
  var article = Ember.run(comment, comment.get, 'article');

  equal(article.get('slug'), 'first-article');
  ok(article instanceof Article);
});

test("model can be specified with a string instead of a class", function() {
  var Article = Ember.ArticleModel = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      Comment = Ember.Model.extend({
        article: Ember.belongsTo('Ember.ArticleModel', { key: 'article', embedded: true })
      });

  Article.primaryKey = 'slug';

  var comment = Comment.create();
  Ember.run(comment, comment.load, 1, { article: { slug: 'first-article' } });
  var article = Ember.run(comment, comment.get, 'article');

  equal(article.get('slug'), 'first-article');
  ok(article instanceof Article);
});

test("non embedded belongsTo should get a record by its id", function() {
  var Article = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      Comment = Ember.Model.extend({
        article: Ember.belongsTo(Article, { key: 'article_slug' })
      });

  Article.primaryKey = 'slug';
  Article.adapter = Ember.FixtureAdapter.create();
  Article.FIXTURES = [{ slug: 'first-article' }];

  var comment = Comment.create();
  Ember.run(comment, comment.load, 1, { article_slug: 'first-article'  });
  var article = Ember.run(comment, comment.get, 'article');

  stop();
  article.then(function() {
    start();
    equal(article.get('slug'), 'first-article');
    ok(article instanceof Article);
  });
});

test("relationship should be refreshed when data changes", function() {
  var Article = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      Comment = Ember.Model.extend({
        article: Ember.belongsTo(Article, { key: 'article_slug' })
      });

  Article.primaryKey = 'slug';
  Article.adapter = Ember.FixtureAdapter.create();
  Article.FIXTURES = [{ slug: 'first-article' }];

  var comment = Comment.create();
  var article = Ember.run(comment, comment.get, 'article');

  ok(!article, "belongsTo relationship should default to null if there is no primaryKey defined");

  Ember.run(comment, comment.load, 1, { article_slug: 'first-article'  });
  article = Ember.run(comment, comment.get, 'article');

  stop();
  article.then(function() {
    start();
    equal(article.get('slug'), 'first-article');
    ok(article instanceof Article);
  });
});

test("when fetching an association getBelongsTo is called", function() {
  expect(4);

  var Article = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      Comment = Ember.Model.extend({
        article: Ember.belongsTo(Article, { key: 'article_slug' })
      });

  Article.primaryKey = 'slug';

  var comment = Comment.create();
  Ember.run(comment, comment.load, 1, { article_slug: 'first-article'  });

  comment.getBelongsTo = function(key, type, meta) {
    equal(key, 'article_slug', "key passed to getBelongsTo should be the same as key in belongsTo options");
    equal(type, Article, "type of the association should be passed to getBelongsTo");
    equal(meta.kind, 'belongsTo', "metadata should be passed to getBelongsTo");

    return 'foobar';
  };

  equal(comment.get('article'), 'foobar', "value returned from getBelongsTo should be returned as an association");
});
