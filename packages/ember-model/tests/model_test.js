var Model, ModelWithoutID;

QUnit.module("Ember.Model", {
  beforeEach: function() {
    Model = Ember.Model.extend({
      token: Ember.attr(),
      name: Ember.attr()
    });
    Model.primaryKey = 'token';
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {token: 'a', name: 'Erik'}
    ];
    ModelWithoutID = Model.extend();
    ModelWithoutID.adapter = Ember.FixtureAdapter.create();
    ModelWithoutID.FIXTURES = [
      {name: 'Erik'},
      {name: 'Alex'}
    ];
  }
});

QUnit.test("creates reference when creating record", function(assert) {
  assert.expect(4);

  var nextClientId = Model._clientIdCounter,
      model = Model.create({ token: 'abc123' }),
      reference = model._reference,
      nextModel = Model.create();

  assert.equal(reference.clientId, nextClientId, "client id should be set for each new record");
  assert.notEqual(nextModel._reference.clientId, reference.clientId, "client id should be unique");
  assert.equal(reference.id, 'abc123', "reference should keep record's id");
  assert.equal(reference.record, model, "reference should keep a reference to a model");
});

QUnit.test("updates reference and cache when primary key changes", function(assert) {
  assert.expect(7);

  var model = Model.create(),
      reference = model._reference;

  assert.equal(reference.id, undefined, "reference should keep record's id");
  assert.equal(reference.record, model, "reference should keep a reference to a model");

  model.load('abc123', { token: 'abc123', name: 'Joy' });
  reference = model._reference;

  assert.equal(reference.id, 'abc123', "reference should be updated to record's id");
  assert.equal(reference.record, model, "reference should keep a reference to a model");
  assert.equal(reference.record.get('token'), 'abc123', "reference should have updated record's property");
  assert.equal(reference.record.get('name'), 'Joy', "reference should have updated record's property");
  assert.equal(Model.find('abc123'), model, 'find should get model');
});

QUnit.test("isLoaded observers have all the updated properties", function(assert) {
  assert.expect(2);

  var FooAdapter = Ember.RESTAdapter.extend({
    find: function (record, id) {
      record.load(id, { token: id, name: 'Joy' });
    }
  });

  var Foo = Model.extend({
    isLoadedDidChange: Ember.observer('isLoaded', function() {
      assert.ok(this.get('isLoaded'));
      assert.ok(!this.get('isNew'), "loaded model should not be new");
    })
  });

  Foo.reopenClass({
    adapter: FooAdapter.create()
  });

  var model = Foo.find('abc123');
});

QUnit.test("can define attributes with Ember.attr, data is accessible", function(assert) {
  var instance = Model.create({name: "Erik"});

  assert.equal(instance.get('name'), "Erik", "Property value was retained");
});

QUnit.test("can handle models without an ID", function(assert) {
  assert.expect(3);
  var done = assert.async();

  var records = ModelWithoutID.find();
  records.on('didLoad', function() {
    assert.equal(records.get('length'), 2);
    assert.equal(records.get('firstObject.name'), 'Erik');
    assert.equal(records.get('lastObject.name'), 'Alex');
    done();
  });
});

QUnit.test("can handle models with ID of zero", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var ModelWithZeroID = Model.extend({
    id: Ember.attr(),
    name: Ember.attr()
  });

  ModelWithZeroID.adapter = Ember.FixtureAdapter.create();
  ModelWithZeroID.FIXTURES = [
    { id: 0, name: 'Erik' }
  ];

  var record = Ember.run(ModelWithZeroID, ModelWithZeroID.find, 0);

  record.on('didLoad', function() {
    assert.equal(record.get('name'), 'Erik');
    done();
  });

});

// QUnit.test("coercion", function() {
// });

QUnit.test(".find(id) delegates to the adapter's find method", function(assert) {
  assert.expect(6);
  var done = assert.async();

  var record = Ember.run(Model, Model.find, 'a');
  assert.ok(record, "Record was returned by find");
  assert.ok(!record.get('isLoaded'));
  assert.ok(record.get('isLoading'));

  record.on('didLoad', function() {
    assert.equal(record.get('name'), 'Erik', "Loaded value is accessible from the record");
    assert.ok(record.get('isLoaded'));
    assert.ok(!record.get('isLoading'));
    done();
  });
});

QUnit.test(".find([]) called with a single record returns cache before delgating to adapter's find method", function(assert) {
  assert.expect(1);

  Model.load([{ token: 'a', name: 'Yehuda' }]);
  Model.adapter = Ember.FixtureAdapter.extend({
    find: function() {
      assert.ok(false, "record should have been loaded via cache");
      return this._super.apply(this, arguments);
    }
  }).create();

  var record = Ember.run(Model, Model.find, ['a']);
  Ember.run(Model, Model.find, 'a');
  assert.ok(record, "Record was returned by find");
});

QUnit.test(".find([]) called when Model.transient true always delegates to adapter's find", function(assert) {
  assert.expect(3);

  Model.transient = true;
  Model.load([{ token: 'a', name: 'Yehuda' }]);
  Model.adapter = Ember.FixtureAdapter.extend({
    find: function() {
      assert.ok(true, "record should not get loaded from cache");
      return this._super.apply(this, arguments);
    }
  }).create();

  var record = Ember.run(Model, Model.find, ['a']);
  Ember.run(Model, Model.find, 'a');
  assert.ok(record, "Record was returned by find");
});

QUnit.test(".reload() loads the record via the adapter after it was loaded", function(assert) {
  assert.expect(1);

  Model.load([{ token: 'a', name: 'Yehuda' }]);
  var record = Ember.run(Model, Model.find, 'a');

  Model.adapter = Ember.FixtureAdapter.extend({
    find: function() {
      assert.ok(true, "find was called in the adapter upon reload");
      return this._super.apply(this, arguments);
    }
  }).create();

  Ember.run(record, record.reload);
});

QUnit.test(".reload() returns a promise", function(assert) {
  assert.expect(2);
  var done = assert.async();

  Model.load([{ token: 'a', name: 'Yehuda' }]);
  var record = Ember.run(Model, Model.find, 'a');

  var promise = Ember.run(record, record.reload);
  promise.then(function(resolvedRecord) {
    assert.ok(resolvedRecord === record, ".reload() resolved with same record");
    assert.ok(true, ".reload() returned a promise");
    done();
  });
});

QUnit.test(".revert() sets the data back to its saved state", function(assert) {
  assert.expect(3);
  var done = assert.async();

  var record = Ember.run(Model, Model.find, 'a');

  record.on('didLoad', function() {
    record.set('name', 'Brian');
    assert.ok(record.get('isDirty'));
    record.revert();

    assert.equal(record.get('name'), 'Erik');
    assert.ok(!record.get('isDirty'));
    done();
  });
});

QUnit.test(".revert() works on new records with no attributes", function(assert) {
  assert.expect(4);

  var record = Model.create();
  assert.ok(!record.get('isDirty'));

  record.set('name', 'Brian');
  assert.ok(record.get('isDirty'));
  record.revert();

  assert.equal(record.get('name'), null);
  assert.ok(!record.get('isDirty'));
});

QUnit.test(".find(id) called multiple times returns the same object (identity map)", function(assert) {
  assert.expect(1);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  assert.equal(first, second);
});

QUnit.test(".unload(model) removes models from caches and subsequent find(id) return new objects", function(assert) {
  assert.expect(4);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  Model.unload(first);

  first.set('token', 'b');
  assert.ok(first.get('token') === second.get('token'), "record models are the same object");

  second = Ember.run(Model, Model.find, 'a');
  assert.ok(first.get('token') !== second.get('token'), "records ids are different");

  second.set('token', 'b');
  assert.ok(first.get('token') === second.get('token'));

  second.set('token', 'c');
  assert.ok(first.get('token') !== second.get('token'));
});

QUnit.test(".clearCache destroys sideloadedData and record references", function(assert) {
  assert.expect(4);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  Model.load([{token: 2, name: 'Yehuda'}]);

  assert.ok(Model._referenceCache !== undefined);
  assert.ok(Model.sideloadedData !== undefined);

  Model.clearCache();

  assert.ok(Model._referenceCache === undefined);
  assert.ok(Model.sideloadedData === undefined);
});

QUnit.test("new records are added to the identity map", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var record = Model.create({token: 2, name: 'Yehuda'});

  record.save();

  record.on("didCreateRecord", function() {
    assert.ok(Model._referenceCache);
    assert.equal(Model._referenceCache[2].record, record);
    done();
  });
});

QUnit.test("creating a new record adds it to existing record arrays", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var records = Model.find();
  var record = Model.create({token: 'b', name: 'Yehuda'});
  record.save();

  record.on('didSaveRecord', function() {
    assert.equal(records.get('length'), 2, "The record array was updated");
    done();
  });
});

QUnit.test("destroying a record removes it from record arrays", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var records = Model.find();
  records.on('didLoad', function() {
    assert.equal(records.get('length'), 1, "The record array was updated");
    var record = Model.find('a');
    record.deleteRecord();
    record.on('didDeleteRecord', function() {
      assert.equal(records.get('length'), 0, "The record array was updated");
      done();
    });
  });
});

QUnit.test("record isNew & isSaving flags", function(assert) {
  assert.expect(5);
  var done = assert.async();

  var record = Model.create();
  assert.ok(record.get('isNew'));

  record.save();
  assert.ok(record.get('isNew'));
  assert.ok(record.get('isSaving'));

  record.on('didSaveRecord', function() {
    assert.ok(!record.get('isNew'));
    assert.ok(!record.get('isSaving'));
    done();
  });
});

QUnit.test("record.toJSON() is generated from Ember.attr definitions", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var record = Ember.run(Model, Model.find, 'a');
  record.on('didLoad', function() {
    assert.deepEqual(record.toJSON(), {token: 'a', name: 'Erik'});
    done();
  });
});

QUnit.test("record.toJSON() uses rootKey if it is defined", function(assert) {
  assert.expect(1);
  var done = assert.async();

  Model.rootKey = 'model';

  var record = Ember.run(Model, Model.find, 'a');
  record.on('didLoad', function() {
    assert.deepEqual(record.toJSON(), { model: { token: 'a', name: 'Erik' } });
    done();
  });
});

QUnit.test("record.toJSON() can use computed property as rootKey", function(assert) {
  assert.expect(1);

  var CPRoot = Model.extend();
  CPRoot.reopenClass({
    rootKey: Ember.computed(function() {
      return 'computed';
    })
  });

  var record = CPRoot.create({
    name: 'Tom Dale'
  });

  assert.deepEqual(record.toJSON(), {computed: {token: undefined, name: 'Tom Dale'}});
});

QUnit.test("Model.fetch() returns a promise", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetch);
  promise.then(function(record) {
    assert.ok(record.get('isLoaded'));
    done();
  });
});

QUnit.test("Model.fetch(id) returns a promise", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetch, 'a');
  promise.then(function(record) {
    assert.ok(record.get('isLoaded'));
    done();
  });
});

QUnit.test("Model#save() returns a promise", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetch, 'a');
  promise.then(function(record) {
    record.set('name', 'Stefan');
    record.save().then(function(record2) {
      assert.equal(record, record2);
      assert.ok(!record.get('isSaving'));
      done();
    });
  });
});

QUnit.test("Model#deleteRecord() returns a promise", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetch, 'a');
  promise.then(function(record) {
    record.deleteRecord().then(function(record2) {
      assert.equal(record, record2);
      assert.ok(record.get('isDeleted'));
      done();
    });
  });
});

QUnit.test("Model#save() works as expected", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var recordsPromise = Ember.run(Model, Model.fetch);
  var record = Ember.run(Model, Model.find, 'a');

  recordsPromise.then(function(records) {
    assert.ok(!record.get('isNew'));

    record.set('name', 'Stefan');
    record.save().then(function() {
      assert.equal(records.get('length'), 1);
      done();
    });
  });
});

QUnit.test("Model#create() works as expected", function(assert) {
  assert.expect(10);
  var done = assert.async();

  var record = Model.create({name: 'Yehuda'});

  assert.ok(record.get('isNew'), "record isNew upon instantiation");
  assert.ok(record.get('isLoaded'), "record isLoaded upon instantiation");
  assert.ok(!record.get('isSaving'), "record isSaving is false upon instantiation");

  record.save().then(function(record2) {
    assert.equal(record, record2, "The same record object is passed into the resolved promise");
    assert.ok(!record.get('isNew'), "The record is no longer new after being saved");
    assert.ok(record.get('isLoaded'), "The record isLoaded");
    assert.ok(!record.get('isSaving'), "The record is no longer saving");
    done();
  });

  assert.ok(record.get('isNew'), "The record is still new until the save completes");
  assert.ok(record.get('isLoaded'), "The record is still loaded while saving is in progress");
  assert.ok(record.get('isSaving'), 'The record isSaving flag is true while saving is in progress');
});

QUnit.test(".getAttributes() returns the model's attributes", function(assert) {
  var attr = Ember.attr,
      BaseModel = Ember.Model.extend({
        id: attr()
      }),

      Person = BaseModel.extend({
        name: attr(),
        nationality: attr()
      }),

      Employee = Person.extend({
        employeeId: attr()
      }),

      Animal = BaseModel.extend({
        order: attr(),
        family: attr(),
        genus: attr(),
        species: attr()
      });

  assert.deepEqual(Employee.getAttributes(), ['id', 'name', 'nationality', 'employeeId']);
  assert.deepEqual(Person.getAttributes(), ['id', 'name', 'nationality']);
  assert.deepEqual(Animal.getAttributes(), ['id', 'order', 'family', 'genus', 'species']);
  assert.deepEqual(BaseModel.getAttributes(), ['id']);
});

QUnit.test(".getRelationships() returns the model's relationships", function(assert) {
  var Comment = Ember.Model.extend(),
      Rating = Ember.Model.extend(),
      Author = Ember.Model.extend(),
      Site = Ember.Model.extend(),

      Commentable = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments' }),
      }),

      Article = Commentable.extend({
        author: Ember.belongsTo(Author, { key: 'author' }),
        ratings: Ember.hasMany(Rating, { key: 'ratings' })
      }),

      News = Article.extend({
        source: Ember.belongsTo(Site, { key: 'site' })
      });

  assert.deepEqual(Commentable.getRelationships(), ['comments']);
  assert.deepEqual(Article.getRelationships(), ['comments', 'author', 'ratings']);
  assert.deepEqual(News.getRelationships(), ['comments', 'author', 'ratings', 'source']);
});

QUnit.test("toJSON includes embedded relationships", function(assert) {
  var attr = Ember.attr,
      Comment = Ember.Model.extend({
        id: Ember.attr(),
        text: Ember.attr()
      }),
      Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Article = Ember.Model.extend({
        id: 1,
        title: Ember.attr(),
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true }),
        author: Ember.belongsTo(Author, { key: 'author', embedded: true })
      });

  var articleData = {
    id: 1,
    title: 'foo',
    comments: [
      {id: 1, text: 'uno'},
      {id: 2, text: 'dos'},
      {id: 3, text: 'tres'}
    ],
    author: {id: 1, name: 'drogus'}
  };

  var article = Article.create();
  Ember.run(article, article.load, articleData.id, articleData);

  var json = Ember.run(article, article.toJSON);

  assert.deepEqual(json.comments.map(function(c) { return c.text; }), ['uno', 'dos', 'tres'], "JSON should contain serialized records from hasMany relationship");
  assert.equal(json.author.name, 'drogus', "JSON should contain serialized record from belongsTo relationship");
});

QUnit.test("toJSON includes non-embedded relationships", function(assert) {
  var Comment = Ember.Model.extend({
        id: Ember.attr(),
        text: Ember.attr()
      }),
      Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Article = Ember.Model.extend({
        id: 1,
        title: Ember.attr(),
        comments: Ember.hasMany(Comment, { key: 'comments' }),
        author: Ember.belongsTo(Author, { key: 'author' })
      });

  var articleData = {
    id: 1,
    title: 'foo',
    comments: [1, 2, 3],
    author: 1
  };

  Author.adapter = Ember.FixtureAdapter.create();
  Comment.adapter = Ember.FixtureAdapter.create();

  Author.FIXTURES = [{id: 1, name: 'drogus'}];
  Comment.FIXTURES = [
    {id: 1, text: 'uno'},
    {id: 2, text: 'dos'},
    {id: 3, text: 'tres'}
  ];


  var article = Article.create();
  Ember.run(article, article.load, articleData.id, articleData);

  var json = Ember.run(article, article.toJSON);

  assert.deepEqual(json.comments, [1, 2, 3], "JSON should contain ids of hasMany relationship");
  assert.equal(json.author, 1, "JSON should contain id of belongsTo relationship");
});

QUnit.test("toJSON works with string names", function(assert) {
  var App;
  Ember.run(function() {
    App = Ember.Application.create({});
    App.register('emstore:main', Ember.Model.Store);
  });

  var Comment = Ember.Model.extend({
        id: Ember.attr(),
        text: Ember.attr()
      }),
      Author = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Article = Ember.Model.extend({
        id: 1,
        title: Ember.attr(),
        comments: Ember.hasMany('comment', { key: 'comments' }),
        author: Ember.belongsTo('author', { key: 'author' })
      });

  App.register('model:comment', Comment);
  App.register('model:author', Author);
  App.register('model:article', Article);

  assert.ok(true);

  var articleData = {
    id: 1,
    title: 'foo',
    comments: [1, 2, 3],
    author: 1
  };

  Author.adapter = Ember.FixtureAdapter.create();
  Comment.adapter = Ember.FixtureAdapter.create();

  Author.FIXTURES = [{id: 1, name: 'drogus'}];
  Comment.FIXTURES = [
    {id: 1, text: 'uno'},
    {id: 2, text: 'dos'},
    {id: 3, text: 'tres'}
  ];

  var store = App.__container__.lookup('emstore:main');
  var article = store.createRecord('article', {name: "Erik"});

  Ember.run(article, article.load, articleData.id, articleData);

  var json = Ember.run(article, article.toJSON);
  assert.deepEqual(json.comments, [1, 2, 3], "JSON should contain ids of hasMany relationship");
  assert.equal(json.author, 1, "JSON should contain id of belongsTo relationship");
  Ember.run(function() {
    App.destroy();
  });
});

QUnit.test("creating a record with camelizedKeys = true works as expected", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var Page = Ember.Model.extend({
    someAuthor: Ember.attr()
  });
  Page.camelizeKeys = true;
  Page.adapter = Ember.FixtureAdapter.create();
  Page.FIXTURES = [];

  var record = Page.create({someAuthor: 'Brian'});

  record.save();

  record.on('didCreateRecord', function() {
    assert.equal(record.get('someAuthor'), 'Brian', 'preserves data keys on didCreateRecord');
    done();
  });
});

QUnit.test("can use data as attribute name", function(assert) {
  assert.expect(1);

  var DataModel = Ember.Model.extend({
    id: Ember.attr(),
    data: Ember.attr()
  });

  DataModel.adapter = Ember.FixtureAdapter.create();

  var record = DataModel.create({id: 1, data: 'abc'});

  assert.deepEqual(record.toJSON(), {id: 1, data: 'abc'});
});

QUnit.test("record is available in reference cache when load is run in cachedRecordForId", function(assert) {
  var recordFromCache,
      Post = Ember.Model.extend({
        load: function() {
          recordFromCache = this.constructor._referenceCache['1'].record;
        }
      });

  Post.sideloadedData = { '1': { id: '1' } };

  Post.cachedRecordForId('1');

  assert.ok(recordFromCache, 'record should be available in cache when running load');
});

QUnit.test("fetchQuery returns a promise", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var FixtureFindQueryAdapter = Ember.FixtureAdapter.extend({
    findQuery: function(klass, records, params) {
      records.set('isLoaded', true);
      return new Ember.RSVP.Promise(function(resolve, reject) {
        resolve(records);
      });
    }
  });

  Model.adapter = FixtureFindQueryAdapter.create();

  var promise = Ember.run(Model, Model.fetchQuery, {name: 'a'});
  promise.then(function(records) {
    assert.ok(records.get('isLoaded'));
    done();
  });
});

QUnit.test("second promise returned by fetchAll when loading, resolves on load", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var deferred = Ember.RSVP.defer();

  var DeferredResolvingAdapter = Ember.FixtureAdapter.extend({
    findAll: function(klass, records, params) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        deferred.promise.then(function() {
          records.set('isLoaded', true);
          resolve(records);
        });
      });
    }
  });
  Model.adapter = DeferredResolvingAdapter.create();

  var firstPromise = Ember.run(Model, Model.fetchAll);
  var secondPromise = Ember.run(Model, Model.fetchAll);

  secondPromise.then(function(records) {
    assert.ok(records.get('isLoaded'), 'records should be loaded when promise resolves');
    done();
  });

  deferred.resolve();
});

QUnit.test("fetchAll returns a promise", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetchAll);
  promise.then(function(records) {
    assert.ok(records.get('isLoaded'));
    assert.equal(records.get('length'), 1);
    done();
  });
});

QUnit.test("fetchAll returns promise if findAll RecordArray already exists", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetch);
  promise.then(function(records) {
    var secondPromise = Ember.run(Model, Model.fetch);
    secondPromise.then(function() {
      assert.ok(true, "Second fetch returned a promise");
      done();
    });
  });
});

QUnit.test("fetchAll resolves to same RecordArray when called multiple times", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var promiseOne = Ember.run(Model, Model.fetch);
  var promiseTwo = Ember.run(Model, Model.fetch);
  Ember.RSVP.all([promiseOne, promiseTwo]).then(function(records) {
    assert.ok(records[0] === records[1], "Both promises resolve with same RecordArray");
    done();
  });
});

QUnit.test("fetchMany returns a promise", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var FixtureFindQueryAdapter = Ember.FixtureAdapter.extend({
    findMany: function(klass, records, params) {
      records.set('isLoaded', true);
      return new Ember.RSVP.Promise(function(resolve, reject) {
        resolve(records);
      });
    }
  });

  Model.adapter = FixtureFindQueryAdapter.create();

  var promise = Ember.run(Model, Model.fetchMany, ['a', 'b']);
  promise.then(function(records) {
    assert.ok(records.get('isLoaded'));
    done();
  });
});

QUnit.test("fetchById returns a promise", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var promise = Ember.run(Model, Model.fetchById, 'a');
  promise.then(function(record) {
    assert.ok(record.get('isLoaded'));
    done();
  });
});

QUnit.test("fetchQuery resolves with error object", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var FixtureFindQueryAdapter = Ember.FixtureAdapter.extend({
    findQuery: function(klass, records, params) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        reject({error: true});
      });
    }
  });

  Model.adapter = FixtureFindQueryAdapter.create();

  var promise = Ember.run(Model, Model.fetchQuery, {name: 'a'});
  promise.then(null, function(error) {
    assert.deepEqual(error, {error: true});
    done();
  });
});

QUnit.test("fetchAll resolves with error object", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var FixtureFindQueryAdapter = Ember.FixtureAdapter.extend({
    findAll: function(klass, records, params) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        reject({error: true});
      });
    }
  });

  Model.adapter = FixtureFindQueryAdapter.create();

  var promise = Ember.run(Model, Model.fetchAll);
  promise.then(null, function(error) {
    assert.equal(error.error, true);
    done();
  });
});

QUnit.test("fetchById resolves with error object", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var FixtureFindQueryAdapter = Ember.FixtureAdapter.extend({
    find: function(record, id) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        reject({error: true});
      });
    }
  });

  Model.adapter = FixtureFindQueryAdapter.create();

  var promise = Ember.run(Model, Model.fetchById, 'a');
  promise.then(null, function(error) {
    assert.deepEqual(error, {error: true});
    done();
  });
});

QUnit.test("fetchMany resolves with error object", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var FixtureFindQueryAdapter = Ember.FixtureAdapter.extend({
    findMany: function(klass, records, params) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        reject({error: true});
      });
    }
  });

  Model.adapter = FixtureFindQueryAdapter.create();

  var promise = Ember.run(Model, Model.fetchMany, ['a', 'b']);
  promise.then(null, function(error) {
    assert.deepEqual(error, {error: true});
    done();
  });
});

QUnit.test(".clearCache destroys _findAllRecordArray reference", function(assert) {
  assert.expect(1);
  var done = assert.async();

  var records = Model.find();
  records.on('didLoad', function() {
    Model.clearCache();
    var newRecords = Model.find();
    assert.equal(newRecords.get( 'isLoaded' ), false, "clearCache should clear _findAllRecordArray");
    done();
  });
});
// // TODO: test that creating a record calls load
//
// // QUnit.test('Model#registerRecordArray', function(){
//
// // });
//
// // QUnit.test('Model#unregisterRecordArray', function(){
//
// // });
