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

test("Can find subgraph by id", function() {
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
