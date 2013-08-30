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
      var deferred = Ember.Deferred.create();
      deferred.then(function() {
        record.didSaveRecord();
      });
      deferred.resolve(record);
      return deferred;
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

  var obj = Model.create();
  Ember.run(function() {
    obj.load(1, {createdAt: '2013-01-01T00:00:00.000Z'});
  });

  ok(obj.get('createdAt'), new Date(2013, 0, 0));
  ok(!obj.get('isDirty'));
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
  var Comment = Ember.Model.extend();

  var Post = Ember.Model.extend({
    comments: Ember.hasMany(Comment, {key: 'comments'})
  });

  var post = Post.create({isNew: false, data: {comments: []}});

  ok(!post.get('isDirty'), "Post should be clean initially");

  var comments = post.get('comments'),
      newComment = Comment.create();
  comments.pushObject(newComment);

  ok(post.get('isDirty'), "After manipulating the hasMany, post should be dirty");
  deepEqual(post.get('_dirtyAttributes'), ['comments']);

  comments.removeObject(newComment);

  ok(!post.get('isDirty'), "After reversing the change, the post should be clean again");
});