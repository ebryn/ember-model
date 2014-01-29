var TestModel, store, container;

module("Ember.Model.Store", {
  setup: function() {
    container = new Ember.Container();

    store = Ember.Model.Store.create({container: container});
    TestModel = Ember.Model.extend({
      token: Ember.attr(),
      name: Ember.attr(),
      type: 'test'
    });
    TestModel.primaryKey = 'token';
    TestModel.adapter = Ember.FixtureAdapter.create({});
    TestModel.FIXTURES = [
      {token: 'a', name: 'Erik'},
      {token: 'b', name: 'Christina'}
    ];

    container.register('model:test', TestModel);
  }
});

test("store.createRecord(type) returns a record with a container", function() {
  var record = Ember.run(store, store.createRecord, 'test');
  equal(record.container, container);
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
  equal(adapter.constructor, Ember.FixtureAdapter.constructor);
});

test("store.adapterFor(type) returns application adapter if no klass.adapter or type adapter", function() {
  TestModel.adapter = undefined;
  container.register('adapter:test', null);
  container.register('adapter:application', Ember.FixtureAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  equal(adapter.constructor, Ember.FixtureAdapter.constructor);
});

test("store.adapterFor(type) defaults to RESTAdapter if no adapter specified", function() {

  TestModel.adapter = undefined;
  container.register('adapter:test', null);
  container.register('adapter:application', null);
  container.register('adapter:REST',  Ember.RESTAdapter);
  var adapter = Ember.run(store, store.adapterFor, 'test');
  equal(adapter.constructor, Ember.RESTAdapter.constructor);
});