var TestModel, EmbeddedModel, UUIDModel, emstore, registry, container, App;

module("Ember.Model.Store", {
  setup: function() {
    registry = new Ember.Registry();
    container = registry.container();

    emstore = Ember.Model.Store.create({container: container});
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
    registry.register('emstore:main', Ember.Model.Store);
  }
});

test("emstore.createRecord(type) returns a record with a container", function() {
  var record = Ember.run(emstore, emstore.createRecord, 'test');
  equal(record.container, container);
  equal(record.container, container);
});

test("emstore.createRecord(type) with properties", function() {
  expect(2);
  var record = Ember.run(emstore, emstore.createRecord, 'test', {token: 'c', name: 'Andrew'});
  equal(record.get('token'), 'c');
  equal(record.get('name'), 'Andrew');
});

test("model.load(hashes) returns a existing record with correct container", function() {
  var model = emstore.modelFor('uuid'),
      record = Ember.run(emstore, emstore.createRecord, 'uuid');

  equal(model, UUIDModel);
  equal(record.container, container);

  ok(record.set('token', 'c'));

  equal(record.get('id'), 1234);
  equal(record.get('token'), 'c');

  model.load({id: 1234, token: 'd', name: 'Andrew'});

  equal(record.get('id'), 1234);
  equal(record.get('token'), 'd');
  equal(record.get('name'), 'Andrew');
  equal(record.get('container'), container);

  model.load({id: 1234, name: 'Peter'}, container);

  equal(record.get('id'), 1234);
  equal(record.get('token'), undefined);
  equal(record.get('name'), 'Peter');
  equal(record.get('container'), container);
});

test("emstore.find(type) returns a record with hasMany and belongsTo that should all have a container", function() {
  expect(4);
  var promise = Ember.run(emstore, emstore.find, 'test', 'a');
  promise.then(function(record) {
    start();
    ok(record.get('container'));
    ok(record.get('embeddedBelongsTo').get('container'));

    record.get('embeddedHasmany').forEach(function(embeddedBelongsToRecord) {
      ok(embeddedBelongsToRecord.get('container'));
    });
  });
  stop();
});

test("emstore.find(type, id) returns a promise and loads a container for the record", function() {
  expect(2);

  var promise = Ember.run(emstore, emstore.find, 'test','a');
  promise.then(function(record) {
    start();
    ok(record.get('isLoaded'));
    ok(record.get('container'));
  });
  stop();
});

test("emstore.find(type) returns a promise and loads a container for each record", function() {
  expect(5);

  var promise = Ember.run(emstore, emstore.find, 'test');
  promise.then(function(records) {
    start();
    equal(records.content.length, 2);
    records.forEach(function(record){
      ok(record.get('isLoaded'));
      ok(record.get('container'));
    });
  });
  stop();
});

test("emstore.find(type, Array) returns a promise and loads a container for each record", function() {
  expect(5);

  var promise = Ember.run(emstore, emstore.find, 'test', ['a','b']);
  promise.then(function(records) {
    start();
    equal(records.content.length, 2);
    records.forEach(function(record){
      ok(record.get('isLoaded'));
      ok(record.get('container'));
    });
  });
  stop();
});

test("emstore.adapterFor(type) returns klass.adapter first", function() {
  var adapter = Ember.run(emstore, emstore.adapterFor, 'test');
  equal(adapter.constructor, Ember.FixtureAdapter);
});

test("emstore.adapterFor(type) returns type adapter if no klass.adapter", function() {
  TestModel.adapter = undefined;
  registry.register('adapter:test', Ember.FixtureAdapter);
  registry.register('adapter:application', null);
  var adapter = Ember.run(emstore, emstore.adapterFor, 'test');
  ok(adapter instanceof Ember.FixtureAdapter);
});

test("emstore.adapterFor(type) returns application adapter if no klass.adapter or type adapter", function() {
  TestModel.adapter = undefined;
  registry.register('adapter:test', null);
  registry.register('adapter:application', Ember.FixtureAdapter);
  var adapter = Ember.run(emstore, emstore.adapterFor, 'test');
  ok(adapter instanceof Ember.FixtureAdapter);
});

test("emstore.adapterFor(type) defaults to RESTAdapter if no adapter specified", function() {

  TestModel.adapter = undefined;
  registry.register('adapter:test', null);
  registry.register('adapter:application', null);
  registry.register('adapter:REST',  Ember.RESTAdapter);
  var adapter = Ember.run(emstore, emstore.adapterFor, 'test');
  ok(adapter instanceof Ember.RESTAdapter);
});

test("emstore.find(type) records use application adapter if no klass.adapter or type adapter", function() {
  expect(3);
  TestModel.adapter = undefined;
  EmbeddedModel.adapter = undefined;
  registry.register('adapter:test', null);
  registry.register('adapter:application', Ember.FixtureAdapter);

  var promise = Ember.run(emstore, emstore.find, 'test','a');

  promise.then(function(record) {
    start();
    ok(record.get('constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for record is application adapter');
    ok(record.get('embeddedBelongsTo.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for belongsTo record is application adapter');
    ok(record.get('embeddedHasmany.firstObject.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for hasMany record is application adapter');
  });

  stop();
});

test("Registering a custom store on application works", function() {
  Ember.run(function() {
    var CustomStore = Ember.Model.Store.extend({ custom: true });
    App = Ember.Application.create({
      TestRoute: Ember.Route.extend(),
      Store: CustomStore
    });
  });

  container = App.__container__;
  ok(container.lookup('emstore:application'));
  ok(container.lookup('emstore:main').get('custom'));

  var testRoute = container.lookup('route:test');
  ok(testRoute.get('emstore.custom'));

  Ember.run(App, 'destroy');
});
