var Model;

module("Ember.Model", {
  setup: function() {
    Model = Ember.Model.extend({
      id: Ember.attr(),
      token: Ember.attr(),
      name: Ember.attr(),
      data: Ember.attr(),
    });
    Model.primaryKey = 'id';
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {id: 1, token: 'a', name: 'Erik', data: 'Foo'},
      {id: 2, token: 'b', name: 'John', data: 'Boo'},
    ];
  },
  teardown: function() {

  }
});

test("Test Model.getGraph()", function() {
  var graph = Model.getGraph();
  deepEqual(graph, {
    id: 1,
    token: 1,
    name: 1,
    data: 1
  });
});

test("Can .find() subgraph by id", function() {
  expect(14);
  var record = Ember.run(Model, Model.find, 1, {name: 1});
  ok(record, "Record was returned by find");
  ok(!record.get('isLoaded'));
  ok(record.get('isLoading'));

  record.one('didLoad', function() {
    start();
    equal(record.get('id'), 1, "Loaded primary key");
    equal(record.get('name'), 'Erik', "Loaded value is accessible from the record");
    ok(record.get('isLoaded'));
    ok(!record.get('isLoading'));
    ok(record.get('isSub'), "isSub property is set to true");

    var otherRecord = Ember.run(Model, Model.find, 1, {token: 1, data: 1});
    strictEqual(record, otherRecord, "Multiple calls to find() operate on the same record");
    otherRecord.on('didLoad', function() {
      start();
      equal(record.get('id'), 1, "Loaded primary key");
      equal(record.get('name'), 'Erik', "Loaded value is accessible from the record");
      equal(record.get('token'), 'a');
      equal(record.get('data'), 'Foo');
      ok(!record.get('isSub'));
    });

    stop();
  });

  stop();
});

test("Can batch .find() subgraphs", function() {
  expect(2);

  var Adapter = Ember.FixtureAdapter.extend({
    find: function() {
      ok(false, "Find was called");
    },

    findMany: function(klass, records, ids, subgraph) {
      deepEqual(subgraph, {
        id: 1,
        name: 1,
        token: 1
      });

      deepEqual(ids, [1, 2], "The correct ids were passed");

      return this._super(klass, records, ids, subgraph);
    }
  });

  Model.adapter = Adapter.create();

  Ember.run(function() {
    Model.find(1, {name: 1});
    Model.find(2, {token: 1});
  });
});

test("Can .fetchMany([]) by id", function() {
  var promise = Ember.run(Model, Model.fetchMany, [1, 2], {name: 1});
  promise.then(function(records) {
    start();
    ok(records.get('isLoaded'));
    ok(records.objectAt(0).get('isSub'));
    deepEqual(records.objectAt(0).toJSON(), {id: 1, name: 'Erik'});
  });
  stop();
});

test("Can .fetchQuery() with subgraph", function() {
  expect(2);

  var Adapter = Ember.FixtureAdapter.extend({
    findQuery: function(klass, records, params, subgraph) {
      deepEqual(subgraph, {id: 1, name: 1});
      records.set('isLoaded', true);
      return new Ember.RSVP.Promise(function(resolve, reject) {
        resolve(records);
      });
    }
  });
  Model.adapter = Adapter.create();
  var promise = Ember.run(Model, Model.fetchQuery, {name: 'Erik'}, {name: 1});
  promise.then(function(records) {
    start();
    ok(records.get('isLoaded'));
  });
  stop();
});

test("Can .findAll() with a subgraph", function() {
  expect(4);
  var records = Model.findAll({name: 1});
  records.on('didLoad', function(){
    start();
    strictEqual(records.get('length'), 2, "Should have all records");
    deepEqual(records.objectAt(0).toJSON(), {id: 1, name: "Erik"});
    ok(records.objectAt(0).get('isSub'), "Should be a sub model");
    deepEqual(records.objectAt(0).get('deferredGraph'), {token: 1, data: 1}, "Deferred graph should be equal");
  });
  stop();
});

test("Accessing deferred attribute triggers reload", function() {
  expect(2);
  var record = Ember.run(Model, Model.find, 1, {name: 1});
  record.one('didLoad', function() {
    start();
    var tokenPromise = record.get('token');
    tokenPromise.then(function(token){
      start();
      equal(token, 'a', "Able to access deferred attribute after promise resolves");
      ok(!record.get('isSub'), "No longer submodel");
    });
    stop();
  });
  stop();
});

