var TestModel, EmbeddedModel, UUIDModel, store, registry, owner, container, App;

//TODO: extract for easy use in other tests
var Owner = Ember.Object.extend(Ember._RegistryProxyMixin, Ember._ContainerProxyMixin);

QUnit.module("Ember.Model.Store", {
  beforeEach: function() {
    registry = new Ember.Registry();
    owner = Owner.create({
      __registry__: registry
    });
    container = registry.container({
      owner: owner
    });
    owner.__container__ = container;

    store = Ember.Model.Store.create();
    Ember.setOwner(store, container);

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

    registry.register('model:test', TestModel);
    registry.register('model:embedded', EmbeddedModel);
    registry.register('model:uuid', UUIDModel);
    registry.register('store:main', Ember.Model.Store);
  }
});

QUnit.test("store.createRecord(type) returns a record with an owner", function(assert) {
  var record = Ember.run(store, store.createRecord, 'test');
  assert.equal(Ember.getOwner(record), container);
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
  assert.equal(Ember.getOwner(record), container);

  assert.ok(record.set('token', 'c'));

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), 'c');

  model.load({id: 1234, token: 'd', name: 'Andrew'});

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), 'd');
  assert.equal(record.get('name'), 'Andrew');
  assert.equal(Ember.getOwner(record), container);

  model.load({id: 1234, name: 'Peter'}, container);

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), undefined);
  assert.equal(record.get('name'), 'Peter');
  assert.equal(Ember.getOwner(record), container);
});

QUnit.test("store.find(type) returns a record with hasMany and belongsTo that should all have an owner", function(assert) {
  assert.expect(4);
  var done = assert.async();

  var promise = Ember.run(store, store.find, 'test', 'a');

  promise.then(function(record) {
    assert.equal(Ember.getOwner(record), container);

    assert.equal(Ember.getOwner(record.get('embeddedBelongsTo')), container);

    record.get('embeddedHasmany').forEach(function(embeddedBelongsToRecord) {
      assert.equal(Ember.getOwner(embeddedBelongsToRecord), container);
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
    assert.equal(Ember.getOwner(record), container);

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
      assert.equal(Ember.getOwner(record), container);
    });

    done();
  });
});

QUnit.test("store.find(type, Array) returns a promise and loads an owner for each record", function(assert) {
  assert.expect(3); //TODO: 5?
  var done = assert.async();

  var promise = Ember.run(store, store.find, 'test', ['a','b']);
  promise.then(function(records) {
    assert.equal(records.content.length, 2);
    records.forEach(function(record){
      // assert.ok(record.get('isLoaded')); //TODO: GJ: should these be loaded?
      assert.equal(Ember.getOwner(record), container);
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
  registry.register('adapter:test', Ember.FixtureAdapter);
  registry.unregister('adapter:application');
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.FixtureAdapter);
});

QUnit.test("store.adapterFor(type) returns application adapter if no klass.adapter or type adapter", function(assert) {
  TestModel.adapter = undefined;
  registry.unregister('adapter:test');
  registry.register('adapter:application', Ember.FixtureAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.FixtureAdapter);
  assert.ok(true);
});

QUnit.test("store.adapterFor(type) defaults to RESTAdapter if no adapter specified", function(assert) {
  TestModel.adapter = undefined;
  registry.unregister('adapter:test');
  registry.unregister('adapter:application');
  registry.register('adapter:REST', Ember.RESTAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.RESTAdapter);
});
// //
// // test("store.find(type) records use application adapter if no klass.adapter or type adapter", function() {
// //   expect(3);
// //   TestModel.adapter = undefined;
// //   EmbeddedModel.adapter = undefined;
// //   registry.register('adapter:test', null);
// //   registry.register('adapter:application', Ember.FixtureAdapter);
// //
// //   var promise = Ember.run(store, store.find, 'test','a');
// //
// //   promise.then(function(record) {
// //     start();
// //     ok(record.get('constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for record is application adapter');
// //     ok(record.get('embeddedBelongsTo.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for belongsTo record is application adapter');
// //     ok(record.get('embeddedHasmany.firstObject.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for hasMany record is application adapter');
// //   });
// //
// //   stop();
// // });
// //
// // test("Registering a custom store on application works", function() {
// //   Ember.run(function() {
// //     var CustomStore = Ember.Model.Store.extend({ custom: true });
// //     App = Ember.Application.create({
// //       TestRoute: Ember.Route.extend(),
// //       Store: CustomStore
// //     });
// //   });
// //
// //   container = App.__container__;
// //   ok(container.lookup('store:application'));
// //   ok(container.lookup('store:main').get('custom'));
// //
// //   var testRoute = container.lookup('route:test');
// //   ok(testRoute.get('store.custom'));
// //
// //   Ember.run(App, 'destroy');
// // });
