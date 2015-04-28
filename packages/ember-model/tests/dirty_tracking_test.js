var attr = Ember.attr;

module("Dirty tracking");

test("when no properties have changed on a model, save should noop", function() {
  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      throw "saveRecord shouldn't be called";
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false});
  ok(!obj.get('isDirty'));

  Ember.run(obj, obj.save);

  ok(!obj.get('isSaving'));
});

test("when properties have changed on a model, isDirty should be set", function() {
  expect(3);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      ok(true, "saveRecord was called");
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false});
  ok(!obj.get('isDirty'));

  obj.set('name', 'Jeffrey');
  ok(obj.get('isDirty'));

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

test("when properties are changed back to the loaded value, isDirty should be false", function() {
  expect(6);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      ok(true, "saveRecord was called");
    }
  };

  var obj = Ember.run(Model, Model.create, {isNew: false, name: 'Erik'});
  ok(!obj.get('isDirty'));
  deepEqual(obj._dirtyAttributes, [], "There shouldn't be any dirty attributes");

  obj.set('name', 'Jeffrey');
  ok(obj.get('isDirty'));
  deepEqual(obj._dirtyAttributes, ["name"], "Name should be dirty");

  obj.set('name', 'Erik');
  ok(!obj.get('isDirty'));
  deepEqual(obj._dirtyAttributes, [], "There shouldn't be any dirty attributes");
});

test("after saving, the model shouldn't be dirty", function() {
  expect(3);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function(record) {
      ok(true, "saveRecord was called");
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
  ok(obj.get('isDirty'));

  stop();
  Ember.run(function() {
    obj.save().then(function() {
      start();
      ok(!obj.get('isDirty'), "The record is no longer dirty");
    });
  });
});

test("after reloading, the model shouldn't be dirty", function() {
  expect(2);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr()
  });
  Model.adapter = Ember.FixtureAdapter.create();

  Model.load([{ id: '123', name: 'Version 1' }]);
  var record = Ember.run(Model, Model.find, '123');
  record.set('name', 'Version 2');
  ok(record.get('isDirty'));

  stop();
  Ember.run(function() {
    record.reload().then(function() {
      start();
      ok(!record.get('isDirty'), "The record is no longer dirty");
    });
  });
});

test("dirty checking works with boolean attributes", function() {
  var Model = Ember.Model.extend({
    canSwim: attr(Boolean)
  });

  var obj = Model.create();
  Ember.run(function() {
    obj.load(1, {canSwim: true});
  });

  ok(!obj.get('isDirty'));
  obj.set('canSwim', false);
  ok(obj.get('isDirty'), "toggling a boolean value makes the record dirty");
});

test("dirty checking works with date attributes", function() {
  var Model = Ember.Model.extend({
    createdAt: attr(Date)
  });
  var originalDate = new Date(2013, 0, 0);
  var obj = Model.create();
  Ember.run(function() {
    obj.load(1, {createdAt: originalDate.toISOString()});
  });

  deepEqual(obj.get('createdAt'), originalDate);
  ok(!obj.get('isDirty'));

  obj.set('createdAt', new Date(2013, 10, 2));
  ok(obj.get('isDirty'), "changing a Date attribute makes the record dirty");

  obj.set('createdAt', originalDate);
  ok(!obj.get('isDirty'), "changing a Date attribute back to original value makes the record clean");
});

test("getting embedded belongsTo attribute after load should not make parent dirty", function() {
  expect(2);
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
  equal(post.get('isDirty'), false, 'loaded record for post is not dirty');

  var author = post.get('author');
  equal(post.get('isDirty'), false, 'get belongsTo relationship does not dirty post record');
});

test("loading record with embedded hasMany attribute should not make it dirty", function() {
  expect(3);

  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments', embedded: true})
  });

  Post.adapter = Ember.FixtureAdapter.create();
  var post = Post.create();

  ok(!post.get('comments.isDirty'), "Post comments should be clean initially");

  Ember.run(function() {
    post.load(1, {comments: [Comment.create()]});
  });

  ok(!post.get('isDirty'), "Post should be clean after load");
  ok(!post.get('comments.isDirty'), "Post comments should be clean after load");
});

test("isDirty is observable", function() {
  expect(2);

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
    equal(obj.get('isDirty'), expectDirty, 'isDirty is as expected');
  });

  expectDirty = true;
  obj.set('name', 'Brian');

  expectDirty = false;
  obj.set('name', 'Erik');
});

test("manipulating object presence in a hasMany should dirty the parent", function() {
  expect(7);
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });
  Post.adapter = Ember.FixtureAdapter.create();

  var post = Post.create({isNew: false, _data: {comments: []}});

  ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment = Comment.create();
  comments.pushObject(newComment);

  ok(post.get('isDirty'), "After manipulating the hasMany, post should be dirty");
  deepEqual(post.get('_dirtyAttributes'), ['comments']);

  comments.removeObject(newComment);

  ok(!post.get('isDirty'), "After reversing the change, the post should be clean again");

  comments.pushObject(newComment);
  stop();
  Ember.run(function() {
    post.save().then(function() {
      start();
      ok(!post.get('isDirty'), "The post is clean after being saved");

      comments.removeObject(newComment);
      ok(post.get('isDirty'), "After being modified, the post should be dirty");

      comments.pushObject(newComment);
      ok(!post.get('isDirty'), "After reverting to the saved state, the post should be clean again");
    });
  });
});

test("manipulating the order of objects in a hasMany shouldn't dirty the parent", function() {
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

  ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      comment1 = Comment.find(1),
      comment2 = Comment.find(2);

  equal(comments.get('length'), 2, "There should be two comments");

  comments.removeObject(comment1);
  comments.pushObject(comment1);

  ok(!post.get('isDirty'), "After manipulating the order of the hasMany, post should not be dirty");
  deepEqual(post.get('_dirtyAttributes'), []);
});

test("modifying hasMany record should make parent dirty", function() {
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
  ok(!post.get('isDirty'), "Post should be clean initially");
  author.set('name', 'billy');
  ok(post.get('isDirty'), "After changing author name, post should become dirty");
});

test("changing back record in hasMany array should make parent clean again", function() {
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
  ok(!post.get('isDirty'), "Post should be clean initially");
  author.set('name', 'billy');
  ok(post.get('isDirty'), "After changing author name, post should become dirty");
  author.set('name', 'bob');
  ok(!post.get('isDirty'), "After changing author name to original value, post should become clean again");
});

test("manipulating object presence in hasMany array should be reflected in it's _modifiedRecords property", function() {
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });

  var post = Post.create({isNew: false, _data: {comments: []}});

  ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment1 = Comment.create(),
      newComment2 = Comment.create();

  comments.pushObjects([newComment1, newComment2]);

  equal(comments.get('length'), 2);
  equal(comments.get('_modifiedRecords.length'), post.get('comments.length'), 'Number of modified records should be equal to number of added comments');
  comments.clear();
  equal(post.get('comments._modifiedRecords.length'), 0);
  ok(!post.get('isDirty'), "After removing all comments post should be clean again");
});

test("_modifiedRecords property should be clean after clearing hasMany array", function() {
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });

  var post = Post.create({isNew: false, _data: {comments: []}});

  ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment = Comment.create();
  comments.pushObject(newComment);

  equal(post.get('comments._modifiedRecords.length'), 1, 'Newly added records should be tracked in _modifiedRecords property');
  comments.clear();
  deepEqual(post.get('comments._modifiedRecords'), [], 'After removing added record, _modifiedRecords should reflect this change');
  ok(!post.get('isDirty'), "After reversing the change, the post should be clean again");
});

test("isDirty on embedded hasMany records should be false after parent is saved", function() {
  expect(9);

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

  equal(post.get('isDirty'), false, "parent should not be dirty");
  equal(post.get('comments.firstObject.isDirty'), false, 'child should not be dirty');

  post.set('comments.firstObject.body', 'New body');

  equal(post.get('isDirty'), true, 'parent should be dirty');
  equal(post.get('comments.firstObject.isDirty'), true, 'child should be dirty');

  stop();
  post.save().then(function() {
    start();
    equal(post.get('isDirty'), false, "parent should not be dirty");
    equal(post.get('comments.firstObject.isDirty'), false, 'child should not be dirty');
    equal(post.get('comments.firstObject.body'), 'New body', 'updated child property is saved');

    post.set('comments.firstObject.body', 'The body');
    equal(post.get('isDirty'), true, 'parent should be dirty again');
    equal(post.get('comments.firstObject.isDirty'), true, 'child should be dirty again');
  });
});


test("modifying embedded belongsTo should make parent dirty", function() {
  expect(3);
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
  equal(post.get('isDirty'), false, 'post should be clean initially');

  post.set('author.name', 'Billy Bob');
  equal(post.get('author.isDirty'), true, 'author should be dirty after being modified');
  equal(post.get('isDirty'), true, 'changes to embedded belongsTo should dirty the parent');
});

test("changing back embedded belongsTo should make parent clean again", function() {
  expect(3);
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
  ok(!post.get('isDirty'), "Post should be clean initially");
  author.set('name', 'billy');
  ok(post.get('isDirty'), "After changing author name, post should become dirty");
  author.set('name', 'bob');
  ok(!post.get('isDirty'), "After changing author name to original value, post should become clean again");
});

test("save parent of embedded belongsTo", function() {
  expect(9);
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
  equal(post.get('isDirty'), false, 'post should be clean initially');

  post.set('author.name', 'Billy Bob');
  equal(post.get('author.isDirty'), true, 'author should be dirty after being modified');
  equal(post.get('isDirty'), true, 'changes to embedded belongsTo should dirty the parent');

  stop();
  Ember.run(function() {
    post.save().then(function() {
      start();
      equal(post.get('author.isDirty'), false, 'the author should be clean after being saved');
      equal(post.get('isDirty'), false, 'the post should be clean after being saved');

      post.set('author.name', 'John Doe');
      equal(post.get('author.isDirty'), true, 'the author should be dirty again');
      equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');

      post.set('author.name', 'Cory Loken'); // special case: setting back to its original value
      equal(post.get('author.isDirty'), true, 'the author should be dirty because it was saved as "Billy Bob"');
      equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');
    });
  });
});

test("save parent of embedded belongsTo with different named key", function() {
  expect(9);
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
  equal(post.get('isDirty'), false, 'post should be clean initially');

  post.set('author.name', 'Billy Bob');
  equal(post.get('author.isDirty'), true, 'author should be dirty after being modified');
  equal(post.get('isDirty'), true, 'changes to embedded belongsTo should dirty the parent');

  stop();
  Ember.run(function() {
    post.save().then(function() {
      start();
      equal(post.get('author.isDirty'), false, 'the author should be clean after being saved');
      equal(post.get('isDirty'), false, 'the post should be clean after being saved');

      post.set('author.name', 'John Doe');
      equal(post.get('author.isDirty'), true, 'the author should be dirty again');
      equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');

      post.set('author.name', 'Cory Loken'); // special case: setting back to its original value
      equal(post.get('author.isDirty'), true, 'the author should be dirty because it was saved as "Billy Bob"');
      equal(post.get('isDirty'), true, 'the post should be dirty because the author is dirty');
    });
  });
});

test("set embedded belongsTo", function() {
  expect(9);
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
  equal(post.get('isDirty'), false, 'post should be clean initially');

  var firstAuthor = post.get('author');
  var newAuthor = Author.create({ id: 2, name: 'John Doe' });
  post.set('author', newAuthor);
  equal(post.get('author.isDirty'), false, 'author should be clean because it was just created');
  equal(post.get('isDirty'), true, 'post should be dirty because its author was changed');

  stop();
  Ember.run(function() {
    post.save().then(function() {
      start();
      equal(post.get('author.isDirty'), false, 'author should be clean after being saved');
      equal(post.get('isDirty'), false, 'parent should be clean after being saved');

      post.set('author.name', 'Cory Loken');
      equal(post.get('author.isDirty'), true, 'the author should be dirty');
      equal(post.get('isDirty'), true, 'the post should be dirty because the author was changed');

      post.set('author', firstAuthor);
      equal(post.get('author.isDirty'), false, 'the author should be clean because it has not been changed');
      equal(post.get('isDirty'), true, 'the post should be dirty because the author was changed');
    });
  });
});

test("set embedded belongsTo cleans up observers", function() {
  expect(5);
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
    return Ember.meta(obj).watching['isDirty'] || 0;
  }

  var post = Post.create();
  Ember.run(post, post.load, json.id, json);

  var author = post.get('author');
  equal(observers(author), 1, 'there should be one observer on the initial author');

  var newAuthor = Author.create({ id: 2, name: 'John Doe' });
  equal(observers(newAuthor), 0, 'there should be no observers on the author after creation');

  post.set('author', newAuthor);
  equal(observers(newAuthor), 1, 'there should be one observer on the new author');
  equal(observers(author), 0, 'the observer for the old author should have been cleaned up');

  post.set('author', null);
  equal(observers(newAuthor), 0, 'the observer for the new author should have been cleaned up');
});

test("manipulating the content of objects in a hasMany should dirty the parent", function() {
  expect(4);

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

  ok(post.get('isDirty') === false, "Post should not be dirty before changing");

  var comment1 = post.get('comments.firstObject');

  comment1.set('name', 'First Comment');

  ok(comment1.get('isDirty') === true, "comment1 should be dirty after changing it's content");
  ok(post.get('comments.isDirty') === true, "post.comments should be dirty after changing comment1's content");
  ok(post.get('isDirty') === true, "Post should be dirty after changing comment1's content");
});
