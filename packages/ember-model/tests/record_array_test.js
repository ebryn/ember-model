var Model;

module("Ember.RecordArray", {
  setup: function() {
    Model = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Stefan'},
      {id: 3, name: 'Kris'}
    ];
  },
  teardown: function() { }
});

// test("must be created with a modelClass property", function() {
//   throws(function() {
//     Ember.RecordArray.create();
//   }, /RecordArrays must be created with a modelClass/);
// });

test("when called with findMany, should contain an array of the IDs contained in the RecordArray", function() {
  var records = Ember.run(Model, Model.find, [1,2,3]);

  deepEqual(records.get('_ids'), [1,2,3]);
  equal(records.get('length'), 0);
  ok(!records.get('isLoaded'));
  stop();

  Ember.run(records, records.then, function() {
    start();
    equal(records.get('length'), 3);
  });
});