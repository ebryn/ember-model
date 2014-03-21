var TestModel, EmbeddedModel, store, container;

module("Ember.Model.Store", {
  setup: function() {
    container = new Ember.Container();

    store = Ember.Model.Store.create({container: container});
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

    container.register('model:test', TestModel);
    container.register('model:embedded', EmbeddedModel);
  }
});

test("store.createRecord(type) returns a record with a container", function() {
  var record = Ember.run(store, store.createRecord, 'test');
  equal(record.container, container);
});

test("store.find(type) returns a record with hasMany and belongsTo that should all have a container", function() {
  expect(4);
  var promise = Ember.run(store, store.find, 'test', 'a');
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

test("store.find(type, id) returns a promise and loads a container for the record", function() {
  expect(2);

  var promise = Ember.run(store, store.find, 'test','a');
  promise.then(function(record) {
    start();
    ok(record.get('isLoaded'));
    ok(record.get('container'));
  });
  stop();
});

test("store.find(type) returns a promise and loads a container for each record", function() {
  expect(5);

  var promise = Ember.run(store, store.find, 'test');
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

test("store.find(type, Array) returns a promise and loads a container for each record", function() {
  expect(5);

  var promise = Ember.run(store, store.find, 'test', ['a','b']);
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

test("store.adapterFor(type) returns klass.adapter first", function() {
  var adapter = Ember.run(store, store.adapterFor, 'test');
  equal(adapter.constructor, Ember.FixtureAdapter);
});

test("store.adapterFor(type) returns type adapter if no klass.adapter", function() {
  TestModel.adapter = undefined;
  container.register('adapter:test', Ember.FixtureAdapter);
  container.register('adapter:application', null);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  ok(adapter instanceof Ember.FixtureAdapter);
});

test("store.adapterFor(type) returns application adapter if no klass.adapter or type adapter", function() {
  TestModel.adapter = undefined;
  container.register('adapter:test', null);
  container.register('adapter:application', Ember.FixtureAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  ok(adapter instanceof Ember.FixtureAdapter);
});

test("store.adapterFor(type) defaults to RESTAdapter if no adapter specified", function() {

  TestModel.adapter = undefined;
  container.register('adapter:test', null);
  container.register('adapter:application', null);
  container.register('adapter:REST',  Ember.RESTAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  ok(adapter instanceof Ember.RESTAdapter);
});

test("store.find(type) records use application adapter if no klass.adapter or type adapter", function() {
  expect(3);
  TestModel.adapter = undefined;
  EmbeddedModel.adapter = undefined;
  container.register('adapter:test', null);
  container.register('adapter:application', Ember.FixtureAdapter);
  
  var promise = Ember.run(store, store.find, 'test','a');

  promise.then(function(record) {
    start();
    ok(record.get('constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for record is application adapter');
    ok(record.get('embeddedBelongsTo.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for belongsTo record is application adapter');
    ok(record.get('embeddedHasmany.firstObject.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for hasMany record is application adapter');
  });

  stop();
});