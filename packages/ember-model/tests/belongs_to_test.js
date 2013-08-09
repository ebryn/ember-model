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
  article.one('didLoad', function() {
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
  article.one('didLoad', function() {
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

test("toJSON uses the given relationship key in belongsTo", function() {
  expect(1);

  var Article = Ember.Model.extend({
    token: Ember.attr(String)
  });

  Article.primaryKey = 'token';
  Article.adapter = Ember.FixtureAdapter.create();
  Article.FIXTURES = [{ token: 2 }];

  var Comment = Ember.Model.extend({
    article: Ember.belongsTo(Article, { key: 'article_id' })
  });

  var comment = Comment.create();

  Ember.run(comment, comment.load, 1, { article_id: 2 });

  deepEqual(comment.toJSON(), { article_id: 2 }, "belongsTo id should be serialized only under the given key");
});

test("un-embedded belongsTo CP should handle set", function() {
  expect(1);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author_id'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
      author = Author.create();

  Ember.run(function() {
    author.load(100, {id: 100});
    post.load(1, {id: 1, author_id: null});
  });

  Ember.run(function() {
    post.set('author', author);
  });

  deepEqual(post.toJSON(), {id: 1, author_id: 100});

});

test("embedded belongsTo CP should handle set", function() {
  expect(1);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author', embedded: true})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
      author = Author.create();

  Ember.run(function() {
    author.load(100, {id: 100});
    post.load(1, {id: 1, author_id: null});
  });

  Ember.run(function() {
    post.set('author', author);
  });

  deepEqual(post.toJSON(), {id: 1, author: {id: 100}});

});

test("must be set with value of same type", function() {
  expect(1);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author_id'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
      postTwo = Post.create();

  Ember.run(function() {
    post.load(1, {id: 1, author_id: null});
    postTwo.load(2, {id: 2, author_id: null});
  });

  expectAssertion(function() {
      post.set('author', postTwo);
    },
    /Attempted to set property of type/);
});

test("should be able to set relationship to null", function() {
  expect(2);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author_id'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
      author = Post.create();

  Ember.run(function() {
    post.load(1, {id: 1, author_id: 100});
    author.load(100, {id: 100});
  });

  Ember.run(function() {
    post.set('author', null);
  });

  equal(post.get('author'), null);
  deepEqual(post.toJSON(), {id: 1, author_id: null});
});

test("materializing the relationship should should not dirty the record", function() {
  expect(2);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author_id'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Ember.run(Post, Post.create);
  post.get('id');
  ok(!post.get('isDirty'), 'is not dirty before materializing the relationship');
  post.get('author');
  ok(!post.get('isDirty'), 'is not dirty after materializing the relationship');
});

test("setting relationship should make parent dirty", function() {
  expect(1);

  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author_id'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
      author = Author.create();

  Ember.run(function() {
    author.load(100, {id: 100, name: 'bob'});
    post.load(1, {id: 1, author_id: null});
  });

  Ember.run(function() {
    post.set('author', author);
  });

  ok(post.get('isDirty'));
});

test("setting existing nonembedded relationship should make parent dirty", function() {
  expect(1);

  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author_id'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
      author = Author.create(),
      secondAuthor = Author.create();

  Ember.run(function() {
    author.load(100, {id: 100, name: 'bob'});
    secondAuthor.load(101, {id: 101, name: 'ray'});
    post.load(1, {id: 1, author_id: 100});
  });

  Ember.run(function() {
    post.set('author', secondAuthor);
  });

  ok(post.get('isDirty'));
});

test("relationships should be seralized when specified with string", function() {
  expect(1);

  Ember.Author = Ember.Model.extend({
    id: Ember.attr(),
    name: Ember.attr()
  });

  Ember.Post = Ember.Model.extend({
    id: Ember.attr(),
    author: Ember.belongsTo('Ember.Author', {key: 'author_id'})
  });

  Ember.Post.adapter = Ember.FixtureAdapter.create();
  Ember.Author.adapter = Ember.FixtureAdapter.create();

  var post = Ember.Post.create(),
      author = Ember.Author.create();

  Ember.run(function() {
    author.load(100, {id: 100, name: 'bob'});
    post.load(1, {id: 1, author_id: 100});
  });

  deepEqual(post.toJSON(), {id: 1, author_id: 100});
});


test("belongsTo from an embedded source is able to materialize without having to re-find", function() {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        posts: Ember.hasMany('Ember.Post', {key: 'posts', embedded: true}),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    }),
    Post = Ember.Post = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        body: Ember.attr('string'),
        project: Ember.belongsTo('Ember.Project', {key:'project'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{
          id: 1,
          title: 'project one title',
          company: 1, 
          posts: [{id: 1, title: 'title', body: 'body', project:1 }, 
                  {id: 2, title: 'title two', body: 'body two', project:1 }]
      }] 
    };

  Company.load([compJson]);
  var company = Company.find(1);

  equal(company.get('projects.length'), 1);
  equal(company.get('projects.firstObject.posts.length'), 2);
  
  var project1 = company.get('projects.firstObject');
  equal(company, project1.get('company'));

  var post1 = project1.get('posts.firstObject');
  equal(project1, post1.get('project'));
});
