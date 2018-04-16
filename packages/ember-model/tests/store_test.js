var TestModel, EmbeddedModel, UUIDModel, store, owner;

QUnit.module("Ember.Model.Store", {
  beforeEach: function() {
    owner = createOwner();

    TestModel = Ember.Model.extend({
      token: Ember.attr(),
      name: Ember.attr(),
      type: 'test',
      embeddedBelongsTo: Ember.belongsTo('embedded', {
        key: 'embeddedBelongsTo',
        embedded: true
      }),
      embeddedHasmany: Ember.hasMany('embedded', {
        key: 'embeddedHasmany',
        embedded: true
      })
    });
    TestModel.primaryKey = 'token';
    TestModel.adapter = Ember.FixtureAdapter.create({});
    TestModel.FIXTURES = [
      {
        token: 'a',
        name: 'Erik',
        embeddedBelongsTo: {id: 1, name: 'Record 1'},
        embeddedHasmany: [
          {id: 1, name: 'Record 1'},
          {id: 2, name: 'Record 2'}
        ]
      },
      {
        token: 'b',
        name: 'Christina',
        embeddedBelongsTo: {id: 1, name: 'Record 1'},
        embeddedHasmany: [
          {id: 1, name: 'Record 1'},
          {id: 2, name: 'Record 2'}
        ]
      }
    ];

    EmbeddedModel = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr(),
      type: 'test'
    });
    EmbeddedModel.adapter = Ember.FixtureAdapter.create({});

    var uuid = 1234;

    UUIDModel = Ember.Model.extend({
      init: function() {
        this.set('id', uuid++);
        return this._super.apply(this, arguments);
      },
      token: Ember.attr(),
      name: Ember.attr()
    });
    EmbeddedModel.adapter = Ember.FixtureAdapter.create({});

    owner.register('model:test', TestModel);
    owner.register('model:embedded', EmbeddedModel);
    owner.register('model:uuid', UUIDModel);
    owner.register('emstore:main', Ember.Model.Store);

    store = owner.lookup('emstore:main');
  }
});

QUnit.test("store.createRecord(type) returns a record with an owner", function(assert) {
  var record = Ember.run(store, store.createRecord, 'test');
  assert.equal(Ember.getOwner(record), owner);
});

QUnit.test("store.createRecord(type) with properties", function(assert) {
  assert.expect(2);

  var record = Ember.run(store, store.createRecord, 'test', {token: 'c', name: 'Andrew'});
  assert.equal(record.get('token'), 'c');
  assert.equal(record.get('name'), 'Andrew');
});

QUnit.test("model.load(hashes) returns a existing record with correct owner", function(assert) {
  var model = store.modelFor('uuid'),
      record = Ember.run(store, store.createRecord, 'uuid');

  assert.equal(model, UUIDModel);
  assert.equal(Ember.getOwner(record), owner);

  assert.ok(record.set('token', 'c'));

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), 'c');

  model.load({id: 1234, token: 'd', name: 'Andrew'});

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), 'd');
  assert.equal(record.get('name'), 'Andrew');
  assert.equal(Ember.getOwner(record), owner);

  model.load({id: 1234, name: 'Peter'}, owner);

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), undefined);
  assert.equal(record.get('name'), 'Peter');
  assert.equal(Ember.getOwner(record), owner);
});

QUnit.test("store.find(type) returns a record with hasMany and belongsTo that should all have an owner", function(assert) {
  assert.expect(4);
  var done = assert.async();

  var promise = Ember.run(store, store.find, 'test', 'a');

  promise.then(function(record) {
    assert.equal(Ember.getOwner(record), owner);

    assert.equal(Ember.getOwner(record.get('embeddedBelongsTo')), owner);

    record.get('embeddedHasmany').forEach(function(embeddedBelongsToRecord) {
      assert.equal(Ember.getOwner(embeddedBelongsToRecord), owner);
    });

    done();
  });
});

QUnit.test("store.find(type, id) returns a promise and loads an owner for the record", function(assert) {
  assert.expect(2);
  var done = assert.async();

  var promise = Ember.run(store, store.find, 'test', 'a');
  promise.then(function(record) {
    assert.ok(record.get('isLoaded'));
    assert.equal(Ember.getOwner(record), owner);

    done();
  });
});

QUnit.test("store.find(type) returns a promise and loads an owner for each record", function(assert) {
  assert.expect(5);
  var done = assert.async();

  var promise = Ember.run(store, store.find, 'test');
  promise.then(function(records) {
    assert.equal(records.content.length, 2);

    records.forEach(function(record){
      assert.ok(record.get('isLoaded'));
      assert.equal(Ember.getOwner(record), owner);
    });

    done();
  });
});

QUnit.test("store.find(type, Array) returns a promise and loads an owner for each record", function(assert) {
  assert.expect(5);
  var done = assert.async();

  var promise = Ember.run(store, store.find, 'test', ['a','b']);
  promise.then(function(records) {
    assert.equal(records.content.length, 2);
    records.forEach(function(record){
      assert.ok(record.get('isLoaded'));
      assert.equal(Ember.getOwner(record), owner);
    });
    done();
  });
});

QUnit.test("store.adapterFor(type) returns klass.adapter first", function(assert) {
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.equal(adapter.constructor, Ember.FixtureAdapter);
});

QUnit.test("store.adapterFor(type) returns type adapter if no klass.adapter", function(assert) {
  TestModel.adapter = undefined;
  owner.register('adapter:test', Ember.FixtureAdapter);
  owner.unregister('adapter:application');
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.FixtureAdapter);
});

QUnit.test("store.adapterFor(type) returns application adapter if no klass.adapter or type adapter", function(assert) {
  TestModel.adapter = undefined;
  owner.unregister('adapter:test');
  owner.register('adapter:application', Ember.FixtureAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.FixtureAdapter);
  assert.ok(true);
});

QUnit.test("store.adapterFor(type) defaults to RESTAdapter if no adapter specified", function(assert) {
  TestModel.adapter = undefined;
  owner.unregister('adapter:test');
  owner.unregister('adapter:application');
  owner.register('adapter:REST', Ember.RESTAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.RESTAdapter);
});

QUnit.test("store.find(type) records use application adapter if no klass.adapter or type adapter", function(assert) {
  assert.expect(3);
  var done = assert.async();

  TestModel.adapter = undefined;
  EmbeddedModel.adapter = undefined;
  owner.unregister('adapter:test');
  owner.register('adapter:application', Ember.FixtureAdapter);

  var promise = Ember.run(store, store.find, 'test','a');

  promise.then(function(record) {
    assert.ok(record.get('constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for record is application adapter');
    assert.ok(record.get('embeddedBelongsTo.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for belongsTo record is application adapter');
    assert.ok(record.get('embeddedHasmany.firstObject.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for hasMany record is application adapter');
    done();
  });
});

QUnit.test("Registering a custom store on application works", function(assert) {
  var app;
  Ember.run(function() {
    var CustomStore = Ember.Model.Store.extend({ custom: true });
    app = Ember.Application.create({
      TestRoute: Ember.Route.extend(),
      Store: CustomStore
    });
  });

  var container = app.__container__;
  assert.ok(container.lookup('emstore:application'));
  assert.ok(container.lookup('emstore:main').get('custom'));

  var testRoute = container.lookup('route:test');
  assert.ok(testRoute.get('emstore.custom'));

  Ember.run(app, 'destroy');
});
