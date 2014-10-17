var Model, ModelWithoutID;

module("Ember.Model", {
  setup: function() {
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
  },
  teardown: function() {

  }
});

test("creates reference when creating record", function() {
  expect(4);

  var nextClientId = Model._clientIdCounter,
      model = Model.create({ token: 'abc123' }),
      reference = model._reference,
      nextModel = Model.create();

  equal(reference.clientId, nextClientId, "client id should be set for each new record");
  notEqual(nextModel._reference.clientId, reference.clientId, "client id should be unique");
  equal(reference.id, 'abc123', "reference should keep record's id");
  equal(reference.record, model, "reference should keep a reference to a model");
});

test("updates reference and cache when primary key changes", function() {
  expect(7);

  var model = Model.create(),
      reference = model._reference;

  equal(reference.id, undefined, "reference should keep record's id");
  equal(reference.record, model, "reference should keep a reference to a model");

  model.load('abc123', { token: 'abc123', name: 'Joy' });
  reference = model._reference;

  equal(reference.id, 'abc123', "reference should be updated to record's id");
  equal(reference.record, model, "reference should keep a reference to a model");
  equal(reference.record.get('token'), 'abc123', "reference should have updated record's property");
  equal(reference.record.get('name'), 'Joy', "reference should have updated record's property");
  equal(Model.find('abc123'), model, 'find should get model');
});

test("isLoaded observers have all the updated properties", function() {
  expect(2);

  var FooAdapter = Ember.RESTAdapter.extend({
    find: function (record, id) {
      record.load(id, { token: id, name: 'Joy' });
    }
  });

  var Foo = Model.extend({
    isLoadedDidChange: (function() {
      ok(this.get('isLoaded'));
      ok(!this.get('isNew'), "loaded model should not be new");
    }).observes('isLoaded')
  });

  Foo.reopenClass({
    adapter: FooAdapter.create()
  });

  var model = Foo.find('abc123');
});

test("can define attributes with Ember.attr, data is accessible", function() {
  var instance = Model.create({name: "Erik"});

  equal(instance.get('name'), "Erik", "Property value was retained");
});

test("can handle models without an ID", function() {
  expect(3);
  var records = ModelWithoutID.find();
  stop();
  records.on('didLoad', function() {
    start();
    equal(records.get('length'), 2);
    equal(records.get('firstObject.name'), 'Erik');
    equal(records.get('lastObject.name'), 'Alex');
  });

});

test("can handle models with ID of zero", function() {
  expect(1);

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
    start();
    equal(record.get('name'), 'Erik');
  });

  stop();
});

// test("coercion", function() {
// });

test(".find(id) delegates to the adapter's find method", function() {
  expect(6);

  var record = Ember.run(Model, Model.find, 'a');
  ok(record, "Record was returned by find");
  ok(!record.get('isLoaded'));
  ok(record.get('isLoading'));
  stop();

  record.on('didLoad', function() {
    start();
    equal(record.get('name'), 'Erik', "Loaded value is accessible from the record");
    ok(record.get('isLoaded'));
    ok(!record.get('isLoading'));
  });
});

test(".find([]) called with a single record returns cache before delgating to adapter's find method", function() {
  expect(1);

  Model.load([{ token: 'a', name: 'Yehuda' }]);
  Model.adapter = Ember.FixtureAdapter.extend({
    find: function() {
      ok(false, "record should have been loaded via cache");
      return this._super.apply(this, arguments);
    }
  }).create();

  var record = Ember.run(Model, Model.find, ['a']);
  Ember.run(Model, Model.find, 'a');
  ok(record, "Record was returned by find");
});

test(".find([]) called when Model.transient true always delegates to adapter's find", function() {
  expect(3);

  Model.transient = true;
  Model.load([{ token: 'a', name: 'Yehuda' }]);
  Model.adapter = Ember.FixtureAdapter.extend({
    find: function() {
      ok(true, "record should not get loaded from cache");
      return this._super.apply(this, arguments);
    }
  }).create();

  var record = Ember.run(Model, Model.find, ['a']);
  Ember.run(Model, Model.find, 'a');
  ok(record, "Record was returned by find");
});

test(".reload() loads the record via the adapter after it was loaded", function() {
  expect(1);

  Model.load([{ token: 'a', name: 'Yehuda' }]);
  var record = Ember.run(Model, Model.find, 'a');

  Model.adapter = Ember.FixtureAdapter.extend({
    find: function() {
      ok(true, "find was called in the adapter upon reload");
      return this._super.apply(this, arguments);
    }
  }).create();

  Ember.run(record, record.reload);
});

test(".reload() returns a promise", function() {
  expect(2);

  Model.load([{ token: 'a', name: 'Yehuda' }]);
  var record = Ember.run(Model, Model.find, 'a');

  var promise = Ember.run(record, record.reload);
  promise.then(function(resolvedRecord) {
    start();
    ok(resolvedRecord === record, ".reload() resolved with same record");
    ok(true, ".reload() returned a promise");
  });
  stop();
});

test(".revert() sets the data back to its saved state", function() {
  expect(3);

  var record = Ember.run(Model, Model.find, 'a');

  record.on('didLoad', function() {
    start();
    record.set('name', 'Brian');
    ok(record.get('isDirty'));
    record.revert();

    equal(record.get('name'), 'Erik');
    ok(!record.get('isDirty'));
  });
  stop();
});

test(".revert() works on new records with no attributes", function() {
  expect(4);

  var record = Model.create();
  ok(!record.get('isDirty'));

  record.set('name', 'Brian');
  ok(record.get('isDirty'));
  record.revert();

  equal(record.get('name'), null);
  ok(!record.get('isDirty'));
});

test(".find(id) called multiple times returns the same object (identity map)", function() {
  expect(1);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  equal(first, second);
});

test(".unload(model) removes models from caches and subsequent find(id) return new objects", function() {
  expect(4);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  Model.unload(first);

  first.set('token', 'b');
  ok(first.get('token') === second.get('token'), "record models are the same object");

  second = Ember.run(Model, Model.find, 'a');
  ok(first.get('token') !== second.get('token'), "records ids are different");

  second.set('token', 'b');
  ok(first.get('token') === second.get('token'));

  second.set('token', 'c');
  ok(first.get('token') !== second.get('token'));
});

test(".clearCache destroys sideloadedData and record references", function() {
  expect(4);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  Model.load([{token: 2, name: 'Yehuda'}]);

  ok(Model._referenceCache !== undefined);
  ok(Model.sideloadedData !== undefined);

  Model.clearCache();

  ok(Model._referenceCache === undefined);
  ok(Model.sideloadedData === undefined);

});

test("new records are added to the identity map", function() {
  expect(2);

  var record = Model.create({token: 2, name: 'Yehuda'});

  record.save();
  stop();

  record.on("didCreateRecord", function() {
    start();

    ok(Model._referenceCache);
    equal(Model._referenceCache[2].record, record);
  });
});

test("creating a new record adds it to existing record arrays", function() {
  expect(1);

  var records = Model.find();
  var record = Model.create({token: 'b', name: 'Yehuda'});
  record.save();
  stop();

  record.on('didSaveRecord', function() {
    start();
    equal(records.get('length'), 2, "The record array was updated");
  });
});

test("destroying a record removes it from record arrays", function() {
  expect(2);

  var records = Model.find();
  stop();
  records.on('didLoad', function() {
    start();
    equal(records.get('length'), 1, "The record array was updated");
    var record = Model.find('a');
    record.deleteRecord();
    stop();
    record.on('didDeleteRecord', function() {
      start();
      equal(records.get('length'), 0, "The record array was updated");
    });
  });
});

test("record isNew & isSaving flags", function() {
  expect(5);

  var record = Model.create();
  ok(record.get('isNew'));

  record.save();
  ok(record.get('isNew'));
  ok(record.get('isSaving'));

  stop();

  record.on('didSaveRecord', function() {
    start();
    ok(!record.get('isNew'));
    ok(!record.get('isSaving'));
  });
});


test("record.toJSON() is generated from Ember.attr definitions", function() {
  expect(1);

  var record = Ember.run(Model, Model.find, 'a');
  record.on('didLoad', function() {
    start();
    deepEqual(record.toJSON(), {token: 'a', name: 'Erik'});
  });
  stop();
});

test("record.toJSON() uses rootKey if it is defined", function() {
  expect(1);

  Model.rootKey = 'model';

  var record = Ember.run(Model, Model.find, 'a');
  record.on('didLoad', function() {
    start();
    deepEqual(record.toJSON(), { model: { token: 'a', name: 'Erik' } });
  });
  stop();
});

test("record.toJSON() can use computed property as rootKey", function() {
  expect(1);

  var CPRoot = Model.extend();
  CPRoot.reopenClass({
    rootKey: Ember.computed(function() {
      return 'computed';
    })
  });

  var record = CPRoot.create({
    name: 'Tom Dale'
  });

  deepEqual(record.toJSON(), {computed: {token: undefined, name: 'Tom Dale'}});
});

test("Model.fetch() returns a promise", function() {
  expect(1);

  var promise = Ember.run(Model, Model.fetch);
  promise.then(function(record) {
    start();
    ok(record.get('isLoaded'));
  });
  stop();
});

test("Model.fetch(id) returns a promise", function() {
  expect(1);

  var promise = Ember.run(Model, Model.fetch, 'a');
  promise.then(function(record) {
    start();
    ok(record.get('isLoaded'));
  });
  stop();
});

test("Model#save() returns a promise", function() {
  expect(2);

  var promise = Ember.run(Model, Model.fetch, 'a');
  promise.then(function(record) {
    start();
    record.set('name', 'Stefan');
    record.save().then(function(record2) {
      start();
      equal(record, record2);
      ok(!record.get('isSaving'));
    });
    stop();
  });
  stop();
});

test("Model#deleteRecord() returns a promise", function() {
  expect(2);

  var promise = Ember.run(Model, Model.fetch, 'a');
  promise.then(function(record) {
    start();
    record.deleteRecord().then(function(record2) {
      start();
      equal(record, record2);
      ok(record.get('isDeleted'));
    });
    stop();
  });
  stop();
});

test("Model#save() works as expected", function() {
  expect(2);

  var recordsPromise = Ember.run(Model, Model.fetch);
  var record = Ember.run(Model, Model.find, 'a');

  recordsPromise.then(function(records) {
    start();
    ok(!record.get('isNew'));

    record.set('name', 'Stefan');
    record.save().then(function() {
      start();

      equal(records.get('length'), 1);
    });
    stop();
  });
  stop();
});

test("Model#create() works as expected", function() {
  expect(10);

  var record = Model.create({name: 'Yehuda'});

  ok(record.get('isNew'), "record isNew upon instantiation");
  ok(record.get('isLoaded'), "record isLoaded upon instantiation");
  ok(!record.get('isSaving'), "record isSaving is false upon instantiation");

  record.save().then(function(record2) {
    start();
    equal(record, record2, "The same record object is passed into the resolved promise");
    ok(!record.get('isNew'), "The record is no longer new after being saved");
    ok(record.get('isLoaded'), "The record isLoaded");
    ok(!record.get('isSaving'), "The record is no longer saving");
  });

  ok(record.get('isNew'), "The record is still new until the save completes");
  ok(record.get('isLoaded'), "The record is still loaded while saving is in progress");
  ok(record.get('isSaving'), 'The record isSaving flag is true while saving is in progress');

  stop();
});

test(".getAttributes() returns the model's attributes", function() {
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

  deepEqual(Employee.getAttributes(), ['id', 'name', 'nationality', 'employeeId']);
  deepEqual(Person.getAttributes(), ['id', 'name', 'nationality']);
  deepEqual(Animal.getAttributes(), ['id', 'order', 'family', 'genus', 'species']);
  deepEqual(BaseModel.getAttributes(), ['id']);
});

test(".getRelationships() returns the model's relationships", function() {
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

  deepEqual(Commentable.getRelationships(), ['comments']);
  deepEqual(Article.getRelationships(), ['comments', 'author', 'ratings']);
  deepEqual(News.getRelationships(), ['comments', 'author', 'ratings', 'source']);
});

test("toJSON includes embedded relationships", function() {
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

  var map = Ember.EnumerableUtils.map;

  deepEqual(map(json.comments, function(c) { return c.text; }), ['uno', 'dos', 'tres'], "JSON should contain serialized records from hasMany relationship");
  equal(json.author.name, 'drogus', "JSON should contain serialized record from belongsTo relationship");
});

test("toJSON includes non-embedded relationships", function() {
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

  deepEqual(json.comments, [1, 2, 3], "JSON should contain ids of hasMany relationship");
  equal(json.author, 1, "JSON should contain id of belongsTo relationship");
});

test("toJSON works with string names", function() {
  var App;
  Ember.run(function() {
    App = Ember.Application.create({});
  });

  var Comment = Ember.Model.extend({
        container: App.__container__,
        id: Ember.attr(),
        text: Ember.attr()
      }),
      Author = Ember.Model.extend({
        container: App.__container__,
        id: Ember.attr(),
        name: Ember.attr()
      }),
      Article = Ember.Model.extend({
        container: App.__container__,
        id: 1,
        title: Ember.attr(),
        comments: Ember.hasMany('comment', { key: 'comments' }),
        author: Ember.belongsTo('author', { key: 'author' })
      });

  App.__container__.register('model:comment', Comment);
  App.__container__.register('model:author', Author);
  App.__container__.register('model:article', Article);

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

  deepEqual(json.comments, [1, 2, 3], "JSON should contain ids of hasMany relationship");
  equal(json.author, 1, "JSON should contain id of belongsTo relationship");
  Ember.run(function() {
    App.destroy();
  });
});

test("creating a record with camelizedKeys = true works as expected", function() {
  expect(1);

  var Page = Ember.Model.extend({
    someAuthor: Ember.attr()
  });
  Page.camelizeKeys = true;
  Page.adapter = Ember.FixtureAdapter.create();
  Page.FIXTURES = [];

  var record = Page.create({someAuthor: 'Brian'});

  record.save();
  stop();

  record.on('didCreateRecord', function() {
    start();

    equal(record.get('someAuthor'), 'Brian', 'preserves data keys on didCreateRecord');
  });
});

test("can use data as attribute name", function() {
  expect(1);

  var DataModel = Ember.Model.extend({
    id: Ember.attr(),
    data: Ember.attr()
  });

  DataModel.adapter = Ember.FixtureAdapter.create();

  var record = DataModel.create({id: 1, data: 'abc'});

  deepEqual(record.toJSON(), {id: 1, data: 'abc'});
});

test("record is available in reference cache when load is run in cachedRecordForId", function() {
  var recordFromCache,
      Post = Ember.Model.extend({
        load: function() {
          recordFromCache = this.constructor._referenceCache['1'].record;
        }
      });

  Post.sideloadedData = { '1': { id: '1' } };

  Post.cachedRecordForId('1');

  ok(recordFromCache, 'record should be available in cache when running load');
});

test("fetchQuery returns a promise", function() {
  expect(1);

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
    start();
    ok(records.get('isLoaded'));
  });
  stop();
});

test("second promise returned by fetchAll when loading, resolves on load", function() {
  expect(1);

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
    start();
    ok(records.get('isLoaded'), 'records should be loaded when promise resolves');
  });

  deferred.resolve();

  stop();
});

test("fetchAll returns a promise", function() {
    var promise = Ember.run(Model, Model.fetchAll);
    promise.then(function(records) {
      start();
      ok(records.get('isLoaded'));
      equal(records.get('length'), 1);
    });
    stop();
});

test("fetchAll returns promise if findAll RecordArray already exists", function() {
  expect(1);
  var promise = Ember.run(Model, Model.fetch);
  promise.then(function(records) {
    start();
    var secondPromise = Ember.run(Model, Model.fetch);
    secondPromise.then(function() {
      start();
      ok(true, "Second fetch returned a promise");
    });
    stop();
  });
  stop();
});

test("fetchAll resolves to same RecordArray when called multiple times", function() {
  expect(1);
  var promiseOne = Ember.run(Model, Model.fetch);
  var promiseTwo = Ember.run(Model, Model.fetch);
  Ember.RSVP.all([promiseOne, promiseTwo]).then(function(records) {
    start();
    ok(records[0] === records[1], "Both promises resolve with same RecordArray");
  });
  stop();
});

test("fetchMany returns a promise", function() {
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
    start();
    ok(records.get('isLoaded'));
  });
  stop();
});

test("fetchById returns a promise", function() {
  expect(1);

  var promise = Ember.run(Model, Model.fetchById, 'a');
  promise.then(function(record) {
    start();
    ok(record.get('isLoaded'));
  });
  stop();
});

test("fetchQuery resolves with error object", function() {
  expect(1);

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
    start();
    deepEqual(error, {error: true});
  });
  stop();
});

test("fetchAll resolves with error object", function() {
  expect(1);

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
    start();
    equal(error.error, true);
  });
  stop();
});

test("fetchById resolves with error object", function() {
  expect(1);

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
    start();
    deepEqual(error, {error: true});
  });
  stop();
});

test("fetchMany resolves with error object", function() {
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
    start();
    deepEqual(error, {error: true});
  });
  stop();
});

test(".clearCache destroys _findAllRecordArray reference", function() {
  expect(1);

  var records = Model.find();
  records.on('didLoad', function() {
    start();

    Model.clearCache();
    var newRecords = Model.find();
    equal( newRecords.get( 'isLoaded' ), false, "clearCache should clear _findAllRecordArray" );
  });
  stop();
});
// TODO: test that creating a record calls load

// test('Model#registerRecordArray', function(){

// });

// test('Model#unregisterRecordArray', function(){

// });
