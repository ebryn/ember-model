QUnit.module("Ember.belongsTo");

QUnit.test("it exists", function(assert) {
  assert.ok(Ember.belongsTo);
});

QUnit.test("is a CP macro", function(assert) {
  var Article = Ember.Model.extend({
        slug: Ember.attr(String)
      }),
      cp = Ember.belongsTo(Article, { key: 'article', embedded: true }),
      Comment = Ember.Model.extend({
        article: cp
      });

  assert.ok(cp instanceof Ember.ComputedProperty);
});

QUnit.test("using it in a model definition", function(assert) {
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

  assert.equal(article.get('slug'), 'first-article');
  assert.ok(article instanceof Article);
});

QUnit.test("model can be specified with a string instead of a class", function(assert) {
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

  assert.equal(article.get('slug'), 'first-article');
  assert.ok(article instanceof Article);
});

QUnit.test("model can be specified with a string to a resolved path", function(assert) {
  var App;
  Ember.run(function() {
    App = Ember.Application.create({});
    App.register('emstore:main', Ember.Model.Store);
  });
  App.Article  = Ember.Model.extend({
      id: Ember.attr(String)
    });
  App.Comment = Ember.Model.extend({
      article: Ember.belongsTo('article', { key: 'article', embedded: true })
    });

  var store = App.__container__.lookup('emstore:main');
  var comment = store.createRecord('comment', {});

  Ember.run(comment, comment.load, 1, { article: { id: 'a' } });
  var article = Ember.run(comment, comment.get, 'article');

  assert.equal(article.get('id'), 'a');
  assert.ok(article instanceof App.Article);
  Ember.run(App, 'destroy');
});

QUnit.test("non embedded belongsTo should get a record by its id", function(assert) {
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

  assert.equal(article.get('slug'), 'first-article');
  assert.ok(article instanceof Article);
});

QUnit.test("relationship should be refreshed when data changes", function(assert) {
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

  assert.ok(!article, "belongsTo relationship should default to null if there is no primaryKey defined");

  Ember.run(comment, comment.load, 1, { article_slug: 'first-article'  });
  article = Ember.run(comment, comment.get, 'article');

  assert.equal(article.get('slug'), 'first-article');
  assert.ok(article instanceof Article);
});

QUnit.test("when fetching an association getBelongsTo is called", function(assert) {
  assert.expect(4);

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
    assert.equal(key, 'article_slug', "key passed to getBelongsTo should be the same as key in belongsTo options");
    assert.equal(type, Article, "type of the association should be passed to getBelongsTo");
    assert.equal(meta.kind, 'belongsTo', "metadata should be passed to getBelongsTo");

    return 'foobar';
  };

  assert.equal(comment.get('article'), 'foobar', "value returned from getBelongsTo should be returned as an association");
});

QUnit.test("toJSON uses the given relationship key in belongsTo", function(assert) {
  assert.expect(1);

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

  assert.deepEqual(comment.toJSON(), { article_id: 2 }, "belongsTo id should be serialized only under the given key");
});

QUnit.test("un-embedded belongsTo CP should handle set", function(assert) {
  assert.expect(1);

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

  assert.deepEqual(post.toJSON(), {id: 1, author_id: 100});
});

QUnit.test("embedded belongsTo CP should handle set", function(assert) {
  assert.expect(1);

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

  assert.deepEqual(post.toJSON(), {id: 1, author: {id: 100}});

});

QUnit.test("must be set with value of same type", function(assert) {
  assert.expect(1);

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

  expectAssertion(assert, function() {
      post.set('author', postTwo);
    },
    /Attempted to set property of type/);
});

QUnit.test("relationship type cannot be empty", function(assert) {
  assert.expect(1);

  var Author = Ember.Model.extend({
      id: Ember.attr()
    }),
    Post = Ember.Model.extend({
      id: Ember.attr(),
      author: Ember.belongsTo('', {key: 'author_id'})
    });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Post.create(),
    author = Author.create();
  Ember.run(function() {
    post.load(1, {id: 1, author_id: author});
  });

  expectAssertion(assert, function() {
      post.set('author', null);
    },
    /Type cannot be empty/);
});

QUnit.test("should be able to set embedded relationship to null", function(assert) {
  assert.expect(2);

  var Article = Ember.Model.extend({
        id: Ember.attr(String)
      }),
      Comment = Ember.Model.extend({
        article: Ember.belongsTo(Article, { key: 'article', embedded: true }),
        text: Ember.attr(String)
      });

  Comment.adapter = Ember.FixtureAdapter.create();

  var comment = Comment.create();
  Ember.run(comment, comment.load, 1, { article: null });

  assert.equal(comment.get('article'), null); // Materialize the data.
  comment.set('text', 'I totally agree');
  assert.ok(comment.save());
});

QUnit.test("should be able to set nonembedded relationship to null", function(assert) {
  assert.expect(2);

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

  assert.equal(post.get('author'), null);
  assert.deepEqual(post.toJSON(), {id: 1, author_id: undefined});
});

QUnit.test("materializing the relationship should should not dirty the record", function(assert) {
  assert.expect(2);

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
  assert.ok(!post.get('isDirty'), 'is not dirty before materializing the relationship');
  post.get('author');
  assert.ok(!post.get('isDirty'), 'is not dirty after materializing the relationship');
});

QUnit.test("setting relationship should make parent dirty", function(assert) {
  assert.expect(1);

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

  assert.ok(post.get('isDirty'));
});

QUnit.test("setting existing nonembedded relationship should make parent dirty", function(assert) {
  assert.expect(1);

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

  assert.ok(post.get('isDirty'));
});

QUnit.test("setting existing nonembedded relationship to NULL should make parent dirty", function(assert) {
  assert.expect(1);

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
    post.set('author', null);
  });

  assert.ok(post.get('isDirty'));
});

QUnit.test("relationships should be seralized when specified with string", function(assert) {
  assert.expect(1);

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

  assert.deepEqual(post.toJSON(), {id: 1, author_id: 100});
});


QUnit.test("belongsTo from an embedded source is able to materialize without having to re-find", function(assert) {
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

  assert.equal(company.get('projects.length'), 1);
  assert.equal(company.get('projects.firstObject.posts.length'), 2);

  var project1 = company.get('projects.firstObject');
  assert.equal(company, project1.get('company'));

  var post1 = project1.get('posts.firstObject');
  assert.equal(project1, post1.get('project'));
});

QUnit.test("unloaded records are removed from reference cache", function(assert) {
  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 }]
    }, compJson2 = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one new title', company: 1 },
              { id: 2, title: 'project two new title', company: 1 }]
    };

  Company.load([compJson]);
  var company = Company.find(1);
  var project1 = company.get('projects.firstObject');

  assert.equal(company.get('projects.length'), 2);

  Company.unload(company);
  var project2 = company.get('projects').objectAt(1);
  Project.unload(project1);
  Project.unload(project2);

  Company.load([compJson2]);
  company = Company.find(1);
  var reloadedProject1 = company.get('projects.firstObject');

  assert.notEqual(project1, reloadedProject1);
  assert.equal(project1.get('title'), 'project one title');
  assert.equal(reloadedProject1.get('title'), 'project one new title');
});

QUnit.test("unloaded records are removed from hasMany cache", function(assert) {
  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{ id: 1, title: 'project one title', company: 1 },
              { id: 2, title: 'project two title', company: 1 },
              { id: 3, title: 'project three title', company: 1 }]
    };

  Company.load([compJson]);
  var company = Company.find(1),
      project1 = company.get('projects').objectAt(0),
      project2 = company.get('projects').objectAt(1),
      project3 = company.get('projects').objectAt(2);

  assert.equal(company.get('projects.length'), 3);

  project1.set('title', 'changed project one title');
  assert.ok(company.get('projects.isDirty'));

  Project.unload(project1);
  assert.equal(company.get('projects.length'), 2);
  assert.equal(company.get('projects.firstObject.title'), 'project two title');
  assert.ok(!company.get('projects.isDirty'), 'removes dirtiness from unloaded relationship');

  project3.set('title', 'changed project three title');
  Project.unload(project2);
  assert.equal(company.get('projects.length'), 1);
  assert.equal(company.get('projects.firstObject.title'), 'changed project three title');
  assert.ok(company.get('projects.isDirty'), 'remains dirty');
});

QUnit.test("belongsTo records created are available from reference cache", function(assert) {
  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     project: Ember.belongsTo('Ember.Project', {key:'project', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    project:{
          id: 1,
          title: 'project one title',
          company: 1
      }
    };

  Company.load([compJson]);
  var company = Company.find(1);

  var project = company.get('project');
  var projectFromCacheViaFind = Project.find(project.get('id'));
  var projectRecordFromCache = Project._referenceCache[project.get('id')].record;

  assert.equal(project, projectFromCacheViaFind);
  assert.equal(project, projectRecordFromCache);

  // referenced company record is the same as the company returned from find
  assert.equal(company, project.get('company'));
});

QUnit.test("embedded belongsTo with undefined value", function(assert) {
  assert.expect(1);
  var json = {
    id: 1,
    name: 'foo'
    // author missing
  };

  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'author', embedded: true})
      });

  Post.adapter = Ember.FixtureAdapter.create();

  var post = Post.create();
  Ember.run(post, post.load, json.id, json);
  assert.equal(post.get('author'), null);
});

QUnit.test("key defaults to model's property key", function(assert) {
  assert.expect(1);

  var Article = Ember.Model.extend({
    id: Ember.attr()
  });

  Article.adapter = Ember.FixtureAdapter.create();
  Article.FIXTURES = [{ id: 2 }];

  var Comment = Ember.Model.extend({
    article: Ember.belongsTo(Article)
  });

  var comment = Comment.create();

  Ember.run(comment, comment.load, 1, { article: 2 });

  assert.deepEqual(comment.toJSON(), { article: 2 });
});

QUnit.test("non embedded belongsTo should return a record with an owner", function(assert) {
  var App;
  Ember.run(function() {
    App = Ember.Application.create({});
    App.register('emstore:main', Ember.Model.Store);
  });
  App.Article = Ember.Model.extend({
    id: Ember.attr(String)
  });
  App.Comment = Ember.Model.extend({
    article: Ember.belongsTo('article', { key: 'article_slug' })
  });

  App.Article.adapter = Ember.FixtureAdapter.create();
  App.Article.FIXTURES = [{ id: 'first-article' }];

  var store = App.__container__.lookup('emstore:main');
  var comment = store.createRecord('comment', {});

  Ember.run(comment, comment.load, 1, { article_slug: 'first-article'  });
  var article = Ember.run(comment, comment.get, 'article');
  assert.ok(Ember.getOwner(article));
  Ember.run(App, 'destroy');
});
