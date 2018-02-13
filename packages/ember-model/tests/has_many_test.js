var get = Ember.get;

QUnit.module("Ember.hasMany");

QUnit.test("it exists", function(assert) {
  assert.ok(Ember.hasMany);
});

QUnit.test("is a CP macro", function(assert) {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      cp = Ember.hasMany(Comment, { key: 'comments', embedded: true }),
      Article = Ember.Model.extend({
        comments: cp
      });

  Comment.primaryKey = 'token';

  assert.ok(cp instanceof Ember.ComputedProperty);

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});
  var comments = Ember.run(article, article.get, 'comments');

  assert.ok(comments instanceof Ember.EmbeddedHasManyArray);
  assert.equal(comments.get('modelClass'), Comment);
  assert.equal(comments.get('parent'), article);
});

QUnit.test("creates Ember.HasManyArray if embedded is set to false", function(assert) {
var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      cp = Ember.hasMany(Comment, { key: 'comments' }),
      Article = Ember.Model.extend({
        comments: cp
      });

  Comment.primaryKey = 'token';

  assert.ok(cp instanceof Ember.ComputedProperty);

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([1, 2])});
  var comments = Ember.run(article, article.get, 'comments');

  assert.ok(comments instanceof Ember.HasManyArray);
  assert.equal(comments.get('modelClass'), Comment);
  assert.equal(comments.get('parent'), article);
});

QUnit.test("using it in a model definition", function(assert) {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  assert.equal(article.get('comments.length'), 2);
  assert.equal(Ember.run(article, article.get, 'comments.firstObject.token'), 'a');
});

QUnit.test("model can be specified with a string instead of a class", function(assert) {
  var Article = Ember.Model.extend({
      comments: Ember.hasMany('Ember.CommentModel', { key: 'comments', embedded: true })
      }),
      Comment = Ember.CommentModel = Ember.Model.extend({
        token: Ember.attr(String)
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  assert.equal(article.get('comments.length'), 2);
  assert.equal(Ember.run(article, article.get, 'comments.firstObject.token'), 'a');
});

QUnit.test("model can be specified with a string to a resolved path", function(assert) {
  var App;

  Ember.run(function() {
    App = Ember.Application.create({});
    App.register('emstore:main', Ember.Model.Store);
  });

  App.Subcomment = Ember.Model.extend({
    id: Ember.attr(String)
  });
  App.Comment = Ember.Model.extend({
    id: Ember.attr(String),
    subComments: Ember.hasMany('subcomment', { key: 'subcomments', embedded: true })
  });
  App.Article = Ember.Model.extend({
    comments: Ember.hasMany('comment', { key: 'comments', embedded: true })
  });

  var store = App.__container__.lookup('emstore:main');
  var article = store.createRecord('article', {});

  var subcomments = {
    subcomments: Ember.A([
      {id: 'c'},
      {id: 'd'}
    ])
  };
  var comment1 = {id: 'a'};
  comment1.subcomments = subcomments;
  var comment2 = {id: 'b'};

  Ember.run(article, article.load, 1, {comments: Ember.A([comment1, comment2])});

  assert.equal(article.get('comments.length'), 2);
  assert.equal(Ember.run(article, article.get, 'comments.firstObject.id'), 'a');

  Ember.run(App, 'destroy');
});

QUnit.test("when fetching an association getHasMany is called", function(assert) {
  assert.expect(4);

  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  article.getHasMany = function(key, type, meta) {
    assert.equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    assert.equal(type, Comment, "type of the association should be passed to getHasMany");
    assert.equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return 'foobar';
  };

  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  assert.equal(article.get('comments'), 'foobar', "value returned from getHasMany should be returned as an association");
});

QUnit.test("when setting an association that has been neither loaded or fetched getHasMany is called", function(assert) {
    assert.expect(4);
    var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  article.getHasMany = function(key, type, meta) {
    assert.equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    assert.equal(type, Comment, "type of the association should be passed to getHasMany");
    assert.equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return Ember.A();
  };

  article.set('comments', Ember.A([{token: 'a'}, {token: 'b'}]));
  assert.deepEqual(article.get('comments'), [{token: 'a'}, {token: 'b'}], "setting the relation should have created and filled a hasManyArray");
});

QUnit.test("when setting an association that has been loaded but not fetched getHasMany is called", function(assert) {
    assert.expect(4);
    var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  article.getHasMany = function(key, type, meta) {
    assert.equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    assert.equal(type, Comment, "type of the association should be passed to getHasMany");
    assert.equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return Ember.A();
  };

  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  article.set('comments', Ember.A([{token: 'b'}, {token: 'c'}]));
  assert.deepEqual(article.get('comments'), [{token: 'b'}, {token: 'c'}], "setting the relation should have created and filled a hasManyArray");
});

QUnit.test("toJSON uses the given relationship key", function(assert) {
  assert.expect(1);

  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comment_ids' })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  Ember.run(article, article.load, 1, { comment_ids: Ember.A(['a'] )});

  assert.deepEqual(article.toJSON(), { comment_ids: ['a'] }, "Relationship ids should be serialized only under the given key");
});

QUnit.test("materializing the relationship should not dirty the record", function(assert) {
  assert.expect(2);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = Ember.run(Post, Post.create);
  post.get('id');
  assert.ok(!post.get('isDirty'), 'is not dirty before materializing the relationship');
  post.get('authors');
  assert.ok(!post.get('isDirty'), 'is not dirty after materializing the relationship');
});

QUnit.test("has many records created are available from reference cache", function(assert) {
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

  var project = company.get('projects.firstObject');
  var projectFromCacheViaFind = Project.find(project.get('id'));
  var projectRecordFromCache = Project._referenceCache[project.get('id')].record;

  assert.equal(project, projectFromCacheViaFind);
  assert.equal(project, projectRecordFromCache);

  var post = project.get('posts.firstObject');
  var postFromCache = Post.find(post.get('id'));
  assert.equal(post, postFromCache);

});

QUnit.test("relationship type cannot be empty", function(assert) {
  assert.expect(1);

  var Article = Ember.Model.extend({
      comments: Ember.hasMany('', { key: 'comments' })
    }),
    Comment = Ember.CommentModel = Ember.Model.extend({
      token: Ember.attr(String)
    });

  Comment.primaryKey = 'token';

  var article = Article.create(),
     comment = Comment.create();

  var comments = [comment];
  Ember.run(article, article.load, 1, {comments: Ember.A([{token: 'a'}, {token: 'b'}])});

  expectAssertion(assert, function() {
    article.get('comments');
  },
  /Type cannot be empty/);
});

QUnit.test("key defaults to model's property key", function(assert) {
  assert.expect(1);

  var Comment = Ember.Model.extend({
      id: Ember.attr()
    }),
    Article = Ember.Model.extend({
      comments: Ember.hasMany(Comment)
    });

  var article = Article.create();

  Ember.run(article, article.load, 1, { comments: Ember.A(['a'] )});

  assert.deepEqual(article.toJSON(), { comments: ['a'] });
});
