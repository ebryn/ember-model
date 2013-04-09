module("Ember.Adapter#findAll");

test("Model.find() delegates to Adapter#findAll", function() {
  expect(7);

  var Model = Ember.Model.extend({
    name: Ember.attr()
  });
  Model.adapter = Ember.FixtureAdapter.create();
  Model.FIXTURES = [
    {id: 1, name: 'Erik'}
  ];

  var records = Ember.run(Model, Model.find);
  ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  ok(!records.get('isLoaded'));
  ok(records.get('isLoading'));
  stop();

  records.on('didLoad', function() {
    start();
    // equal(records.get('firstObject.id'), 1); // TODO: built-in CP for primaryKey
    equal(records.get('firstObject.name'), 'Erik');
    ok(records.get('firstObject.isLoaded'));
    ok(records.get('isLoaded'));
    ok(!records.get('isLoading'));
  });
});

test("Model.find() always returns the same RecordArray", function() {
  var Model = Ember.Model.extend();
  Model.adapter = {
    findAll: Ember.K
  };

  var firstResult = Model.find();
  var secondResult = Model.find();

  equal(firstResult, secondResult, "The same RecordArray was returned");
});