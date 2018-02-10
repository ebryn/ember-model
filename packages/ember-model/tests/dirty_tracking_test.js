var attr = Ember.attr;

QUnit.module("Dirty tracking");

QUnit.test("when no properties have changed on a model, save should noop", function(assert) {
  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      throw "saveRecord shouldn't be called";
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false});
  assert.ok(!obj.get('isDirty'));

  Ember.run(obj, obj.save);

  assert.ok(!obj.get('isSaving'));
});

QUnit.test("when properties have changed on a model, isDirty should be set", function(assert) {
  assert.expect(3);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      assert.ok(true, "saveRecord was called");
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false});
  assert.ok(!obj.get('isDirty'));

  obj.set('name', 'Jeffrey');
  assert.ok(obj.get('isDirty'));

  Ember.run(obj, obj.save);
});

/* TODO
test("when properties defined in create have not changed on a model, isDirty should be false", function() {
  expect(3);

  var Model = Ember.Model.extend({
    name: attr(),
    city: attr()
  });

  var obj = Ember.run(Model, Model.create, {name: 'Jeffrey', city: 'SF'});
  ok(!obj.get('isDirty'), 'is not dirty before calling set');

  obj.set('name', 'Jeffrey');
  obj.set('city', 'SF');
  ok(!obj.get('isDirty'), 'is not dirty after calling set');

  obj.set('name', 'Erik');
  ok(obj.get('isDirty'), 'is dirty after changing data');
});
*/

QUnit.test("when properties are changed back to the loaded value, isDirty should be false", function(assert) {
  assert.expect(6);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      assert.ok(true, "saveRecord was called");
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false, name: 'Erik'});
  assert.ok(!obj.get('isDirty'));
  assert.deepEqual(obj._dirtyAttributes, [], "There shouldn't be any dirty attributes");

  obj.set('name', 'Jeffrey');
  assert.ok(obj.get('isDirty'));
  assert.deepEqual(obj._dirtyAttributes, ["name"], "Name should be dirty");

  obj.set('name', 'Erik');
  assert.ok(!obj.get('isDirty'));
  assert.deepEqual(obj._dirtyAttributes, [], "There shouldn't be any dirty attributes");
});

QUnit.test("after saving, the model shouldn't be dirty", function(assert) {
  assert.expect(3);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function(record) {
      assert.ok(true, "saveRecord was called");
      var deferred = Ember.RSVP.defer();
      deferred.promise.then(function() {
        record.didSaveRecord();
      });
      deferred.resolve(record);
      return deferred.promise;
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false});
  obj.set('name', 'Erik');
  assert.ok(obj.get('isDirty'));

  var done = assert.async();
  Ember.run(function() {
    obj.save().then(function() {
      assert.ok(!obj.get('isDirty'), "The record is no longer dirty");
      done();
    });
  });
});

QUnit.test("after reloading, the model shouldn't be dirty", function(assert) {
  assert.expect(2);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr()
  });
  Model.adapter = Ember.FixtureAdapter.create();

  Model.load([{ id: '123', name: 'Version 1' }]);
  var record = Ember.run(Model, Model.find, '123');
  record.set('name', 'Version 2');
  assert.ok(record.get('isDirty'));

  var done = assert.async();
  Ember.run(function() {
    record.reload().then(function() {
      assert.ok(!record.get('isDirty'), "The record is no longer dirty");
      done();
    });
  });
});

QUnit.test("dirty checking works with boolean attributes", function(assert) {
  var Model = Ember.Model.extend({
    canSwim: attr(Boolean)
  });

  var obj = Model.create();
  Ember.run(function() {
    obj.load(1, {canSwim: true});
  });

  assert.ok(!obj.get('isDirty'));
  obj.set('canSwim', false);
  assert.ok(obj.get('isDirty'), "toggling a boolean value makes the record dirty");
});

QUnit.test("dirty checking works with date attributes", function(assert) {
  var Model = Ember.Model.extend({
    createdAt: attr(Date)
  });
  var originalDate = new Date(2013, 0, 0);
  var obj = Model.create();
  Ember.run(function() {
    obj.load(1, {createdAt: originalDate.toISOString()});
  });

  assert.deepEqual(obj.get('createdAt'), originalDate);
  assert.ok(!obj.get('isDirty'));

  obj.set('createdAt', new Date(2013, 10, 2));
  assert.ok(obj.get('isDirty'), "changing a Date attribute makes the record dirty");

  obj.set('createdAt', originalDate);
  assert.ok(!obj.get('isDirty'), "changing a Date attribute back to original value makes the record clean");
});

QUnit.test("getting embedded belongsTo attribute after load should not make parent dirty", function(assert) {
  assert.expect(2);
  var json = {
    id: 1,
    name: 'foo',
    author: { id: 1, name: 'Cory Loken' }
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
  assert.equal(post.get('isDirty'), false, 'loaded record for post is not dirty');

  var author = post.get('author');
  assert.equal(post.get('isDirty'), false, 'get belongsTo relationship does not dirty post record');
});

QUnit.test("loading record with embedded hasMany attribute should not make it dirty", function(assert) {
  assert.expect(3);

  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments', embedded: true})
  });

  Post.adapter = Ember.FixtureAdapter.create();
  var post = Post.create();

  assert.ok(!post.get('comments.isDirty'), "Post comments should be clean initially");

  Ember.run(function() {
    post.load(1, {comments: [Comment.create()]});
  });

  assert.ok(!post.get('isDirty'), "Post should be clean after load");
  assert.ok(!post.get('comments.isDirty'), "Post comments should be clean after load");
});

QUnit.test("isDirty is observable", function(assert) {
  assert.expect(2);

  var Model = Ember.Model.extend({
    name: attr()
  });

  var obj = Model.create();
  Ember.run(function() {
    obj.load(1, {name: 'Erik'});
  });

  obj.get('isDirty'); // give isDirty a kick. it's not observable until it's been computed.

  var expectDirty;
  Ember.addObserver(obj, 'isDirty', function() {
    assert.equal(obj.get('isDirty'), expectDirty, 'isDirty is as expected');
  });

  expectDirty = true;
  obj.set('name', 'Brian');

  expectDirty = false;
  obj.set('name', 'Erik');
});

QUnit.test("manipulating object presence in a hasMany should dirty the parent", function(assert) {
  assert.expect(7);
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });
  Post.adapter = Ember.FixtureAdapter.create();

  var post = Post.create({isNew: false, _data: {comments: []}});

  assert.ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment = Comment.create();
  comments.pushObject(newComment);

  assert.ok(post.get('isDirty'), "After manipulating the hasMany, post should be dirty");
  assert.deepEqual(post.get('_dirtyAttributes'), ['comments']);

  comments.removeObject(newComment);

  assert.ok(!post.get('isDirty'), "After reversing the change, the post should be clean again");

  comments.pushObject(newComment);
  var done = assert.async();
  Ember.run(function() {
    post.save().then(function() {
      assert.ok(!post.get('isDirty'), "The post is clean after being saved");

      comments.removeObject(newComment);
      assert.ok(post.get('isDirty'), "After being modified, the post should be dirty");

      comments.pushObject(newComment);
      assert.ok(!post.get('isDirty'), "After reverting to the saved state, the post should be clean again");
      done();
    });
  });
});

QUnit.test("manipulating the order of objects in a hasMany shouldn't dirty the parent", function(assert) {
  var Comment = Ember.Model.extend({
    id: Ember.attr()
  });
  Comment.adapter = Ember.FixtureAdapter.create();
  Comment.FIXTURES = [{
    id: 1
  }, {
    id: 2
  }];

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });

  var post = Post.create({isNew: false, _data: {comments: [1, 2]}});

  assert.ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      comment1 = Comment.find(1),
      comment2 = Comment.find(2);

  assert.equal(comments.get('length'), 2, "There should be two comments");

  comments.removeObject(comment1);
  comments.pushObject(comment1);

  assert.ok(!post.get('isDirty'), "After manipulating the order of the hasMany, post should not be dirty");
  assert.deepEqual(post.get('_dirtyAttributes'), []);
});

QUnit.test("modifying hasMany record should make parent dirty", function(assert) {
  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var author = Author.create();
  var post = Post.create();

  Ember.run(function() {
    post.load(1, {id: 1, author_ids: [100]});
    author.load(100, {id: 100, name: 'bob'});
  });

  post.get('authors');
  assert.ok(!post.get('isDirty'), "Post should be clean initially");
  author.set('name', 'billy');
  assert.ok(post.get('isDirty'), "After changing author name, post should become dirty");
});

QUnit.test("changing back record in hasMany array should make parent clean again", function(assert) {
  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var author = Author.create();
  var post = Post.create();

  Ember.run(function() {
    post.load(1, {id: 1, author_ids: [100]});
    author.load(100, {id: 100, name: 'bob'});
  });

  post.get('authors');
  assert.ok(!post.get('isDirty'), "Post should be clean initially");
  author.set('name', 'billy');
  assert.ok(post.get('isDirty'), "After changing author name, post should become dirty");
  author.set('name', 'bob');
  assert.ok(!post.get('isDirty'), "After changing author name to original value, post should become clean again");
});

QUnit.test("manipulating object presence in hasMany array should be reflected in it's _modifiedRecords property", function(assert) {
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });

  var post = Post.create({isNew: false, _data: {comments: []}});

  assert.ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment1 = Comment.create(),
      newComment2 = Comment.create();

  comments.pushObjects([newComment1, newComment2]);

  assert.equal(comments.get('length'), 2);
  assert.equal(comments.get('_modifiedRecords.length'), post.get('comments.length'), 'Number of modified records should be equal to number of added comments');
  comments.clear();
  assert.equal(post.get('comments._modifiedRecords.length'), 0);
  assert.ok(!post.get('isDirty'), "After removing all comments post should be clean again");
});

QUnit.test("_modifiedRecords property should be clean after clearing hasMany array", function(assert) {
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });

  var post = Post.create({isNew: false, _data: {comments: []}});

  assert.ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment = Comment.create();
  comments.pushObject(newComment);

  assert.equal(post.get('comments._modifiedRecords.length'), 1, 'Newly added records should be tracked in _modifiedRecords property');
  comments.clear();
  assert.deepEqual(post.get('comments._modifiedRecords'), [], 'After removing added record, _modifiedRecords should reflect this change');
  assert.ok(!post.get('isDirty'), "After reversing the change, the post should be clean again");
});

QUnit.test("isDirty on embedded hasMany records should be false after parent is saved", function(assert) {
  assert.expect(9);

  var Comment = Ember.Model.extend({
    body: attr()
  });

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments', embedded: true})
  });

  var post = Post.create({
    isNew: false,
    _data: {
      comments: [{body: "The body"}]
    }
  });
  Post.adapter = {
    saveRecord: function(record) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        Ember.run.later(function() {
          record.didSaveRecord();
          resolve(record);
        }, 1);
      });
    }
  };

  assert.equal(post.get('isDirty'), false, "parent should not be dirty");
  assert.equal(post.get('comments.firstObject.isDirty'), false, 'child should not be dirty');

  post.set('comments.firstObject.body', 'New body');

  assert.equal(post.get('isDirty'), true, 'parent should be dirty');
  assert.equal(post.get('comments.firstObject.isDirty'), true, 'child should be dirty');

  var done = assert.async();
  post.save().then(function() {
    assert.equal(post.get('isDirty'), false, "parent should not be dirty");
    assert.equal(post.get('comments.firstObject.isDirty'), false, 'child should not be dirty');
    assert.equal(post.get('comments.firstObject.body'), 'New body', 'updated child property is saved');

    post.set('comments.firstObject.body', 'The body');
    assert.equal(post.get('isDirty'), true, 'parent should be dirty again');
    assert.equal(post.get('comments.firstObject.isDirty'), true, 'child should be dirty again');
    done();
  });
});


QUnit.test("modifying embedded belongsTo should make parent dirty", function(assert) {
  assert.expect(3);
  var json = {
    id: 1,
    name: 'foo',
    author: { id: 1, name: 'Cory Loken' }
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
  assert.equal(post.get('isDirty'), false, 'post should be clean initially');

  post.set('author.name', 'Billy Bob');
  assert.equal(post.get('author.isDirty'), true, 'author should be dirty after being modified');
  assert.equal(post.get('isDirty'), true, 'changes to embedded belongsTo should dirty the parent');
});

QUnit.test("changing back embedded belongsTo should make parent clean again", function(assert) {
  assert.expect(3);
  var json = {
    id: 1,
    name: 'foo',
    author: { id: 1, name: 'bob' }
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

  var author = post.get('author');
  assert.ok(!post.get('isDirty'), "Post should be clean initially");
  author.set('name', 'billy');
  assert.ok(post.get('isDirty'), "After changing author name, post should become dirty");
  author.set('name', 'bob');
  assert.ok(!post.get('isDirty'), "After changing author name to original value, post should become clean again");
});

QUnit.test("save parent of embedded belongsTo", function(assert) {
  assert.expect(9);
  var json = {
    id: 1,
    name: 'foo',
    author: { id: 1, name: 'Cory Loken' }
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
  assert.equal(post.get('isDirty'), false, 'post should be clean initially');

  post.set('author.name', 'Billy Bob');
  assert.equal(post.get('author.isDirty'), true, 'author should be dirty after being modified');
  assert.equal(post.get('isDirty'), true, 'changes to embedded belongsTo should dirty the parent');

  var done = assert.async();
  Ember.run(function() {
    post.save().then(function() {
      assert.equal(post.get('author.isDirty'), false, 'the author should be clean after being saved');
      assert.equal(post.get('isDirty'), false, 'the post should be clean after being saved');

      post.set('author.name', 'John Doe');
      assert.equal(post.get('author.isDirty'), true, 'the author should be dirty again');
      assert.equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');

      post.set('author.name', 'Cory Loken'); // special case: setting back to its original value
      assert.equal(post.get('author.isDirty'), true, 'the author should be dirty because it was saved as "Billy Bob"');
      assert.equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');
      done();
    });
  });
});

QUnit.test("save parent of embedded belongsTo with different named key", function(assert) {
  assert.expect(9);
  var json = {
    id: 1,
    name: 'foo',
    the_author: { id: 1, name: 'Cory Loken' }
  };

  var Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        author: Ember.belongsTo(Author, {key: 'the_author', embedded: true})
      });

  Post.adapter = Ember.FixtureAdapter.create();

  var post = Post.create();
  Ember.run(post, post.load, json.id, json);
  assert.equal(post.get('isDirty'), false, 'post should be clean initially');

  post.set('author.name', 'Billy Bob');
  assert.equal(post.get('author.isDirty'), true, 'author should be dirty after being modified');
  assert.equal(post.get('isDirty'), true, 'changes to embedded belongsTo should dirty the parent');

  var done = assert.async();
  Ember.run(function() {
    post.save().then(function() {
      assert.equal(post.get('author.isDirty'), false, 'the author should be clean after being saved');
      assert.equal(post.get('isDirty'), false, 'the post should be clean after being saved');

      post.set('author.name', 'John Doe');
      assert.equal(post.get('author.isDirty'), true, 'the author should be dirty again');
      assert.equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');

      post.set('author.name', 'Cory Loken'); // special case: setting back to its original value
      assert.equal(post.get('author.isDirty'), true, 'the author should be dirty because it was saved as "Billy Bob"');
      assert.equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');
      done();
    });
  });
});

QUnit.test("set embedded belongsTo", function(assert) {
  assert.expect(9);
  var json = {
    id: 1,
    name: 'foo',
    author: { id: 1, name: 'Cory Loken' }
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
  assert.equal(post.get('isDirty'), false, 'post should be clean initially');

  var firstAuthor = post.get('author');
  var newAuthor = Author.create({ id: 2, name: 'John Doe' });
  post.set('author', newAuthor);
  assert.equal(post.get('author.isDirty'), false, 'author should be clean because it was just created');
  assert.equal(post.get('isDirty'), true, 'post should be dirty because its author was changed');

  var done = assert.async();
  Ember.run(function() {
    post.save().then(function() {
      assert.equal(post.get('author.isDirty'), false, 'author should be clean after being saved');
      assert.equal(post.get('isDirty'), false, 'parent should be clean after being saved');

      post.set('author.name', 'Cory Loken');
      assert.equal(post.get('author.isDirty'), true, 'the author should be dirty');
      assert.equal(post.get('isDirty'), true, 'the post should be dirty because the author was changed');

      post.set('author', firstAuthor);
      assert.equal(post.get('author.isDirty'), false, 'the author should be clean because it has not been changed');
      assert.equal(post.get('isDirty'), true, 'the post should be dirty because the author was changed');
      done();
    });
  });
});

QUnit.test("set embedded belongsTo cleans up observers", function(assert) {
  assert.expect(5);
  var json = {
    id: 1,
    name: 'foo',
    author: { id: 1, name: 'Cory Loken' }
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

  function observers(obj) {
    var meta = Ember.meta(obj);
    return (meta._watching || meta.watching)['isDirty'] || 0;
  }

  var post = Post.create();
  Ember.run(post, post.load, json.id, json);

  var author = post.get('author');
  assert.equal(observers(author), 1, 'there should be one observer on the initial author');

  var newAuthor = Author.create({ id: 2, name: 'John Doe' });
  assert.equal(observers(newAuthor), 0, 'there should be no observers on the author after creation');

  post.set('author', newAuthor);
  assert.equal(observers(newAuthor), 1, 'there should be one observer on the new author');
  assert.equal(observers(author), 0, 'the observer for the old author should have been cleaned up');

  post.set('author', null);
  assert.equal(observers(newAuthor), 0, 'the observer for the new author should have been cleaned up');
});

QUnit.test("manipulating the content of objects in a hasMany should dirty the parent", function(assert) {
  assert.expect(4);

  var json = {
    id: 1,
    name: 'Comment 1'
  };

  var Comment = Ember.Model.extend({
    id: Ember.attr(),
    name: Ember.attr()
  });

  var Post = Ember.Model.extend({
    id: Ember.attr(),
    comments: Ember.hasMany(Comment, {key: 'comments', embedded: true})
  });

  var post = Post.create({
    isNew: false,
    _data: { comments: [json] }
  });

  assert.ok(post.get('isDirty') === false, "Post should not be dirty before changing");

  var comment1 = post.get('comments.firstObject');

  comment1.set('name', 'First Comment');

  assert.ok(comment1.get('isDirty') === true, "comment1 should be dirty after changing it's content");
  assert.ok(post.get('comments.isDirty') === true, "post.comments should be dirty after changing comment1's content");
  assert.ok(post.get('isDirty') === true, "Post should be dirty after changing comment1's content");
});
