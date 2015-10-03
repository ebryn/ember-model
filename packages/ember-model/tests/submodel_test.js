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
    Model.adapter = Ember.SubmodelFixtureAdapter.create();
    Model.FIXTURES = [
      {id: 1, token: 'a', name: 'Erik', data: 'Foo'},
      {id: 2, token: 'b', name: 'John', data: 'Boo'},
    ];
  },
  teardown: function() {

  }
});


test("Can find subgraph by id", function() {
  var record = Ember.run(Model, Model.find, 1, {name: 1});
  ok(record, "Record was returned by find");
  ok(!record.get('isLoaded'));
  ok(record.get('isLoading'));
  stop();

  record.on('didLoad', function() {
    start();
    equal(record.get('name'), 'Erik', "Loaded value is accessible from the record");
    ok(record.get('isLoaded'));
    ok(!record.get('isLoading'));
    ok(record.get('isSub'), "isSub property is set to true");
  });
});
