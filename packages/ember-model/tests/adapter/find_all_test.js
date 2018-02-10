QUnit.module("Ember.Adapter#findAll");

QUnit.test("Model.find() delegates to Adapter#findAll", function(assert) {
  assert.expect(7);

  var Model = Ember.Model.extend({
    name: Ember.attr()
  });
  Model.adapter = Ember.FixtureAdapter.create();
  Model.FIXTURES = [
    {id: 1, name: 'Erik'}
  ];

  var records = Ember.run(Model, Model.find);
  assert.ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  assert.ok(!records.get('isLoaded'));
  assert.ok(records.get('isLoading'));
  var done = assert.async();

  records.on('didLoad', function() {
    done();
    // equal(records.get('firstObject.id'), 1); // TODO: built-in CP for primaryKey
    assert.equal(records.get('firstObject.name'), 'Erik');
    assert.ok(records.get('firstObject.isLoaded'));
    assert.ok(records.get('isLoaded'));
    assert.ok(!records.get('isLoading'));
  });
});

QUnit.test("Model.find() returns the same RecordArray for each successful call", function(assert) {
  var Model = Ember.Model.extend();
  Model.adapter = {
    findAll: Ember.RSVP.resolve
  };

  var firstResult = Model.find();
  var secondResult = Model.find();

  assert.equal(firstResult, secondResult, "The same RecordArray was returned");
});

QUnit.test("Model.find() returns a new RecordArray if the last call failed", function(assert) {
  var Model = Ember.Model.extend();
  Model.adapter = {
    findAll: Ember.RSVP.reject
  };

  var firstResult, secondResult;
  Ember.run(function() {
    firstResult = Model.find();
  });
  secondResult = Model.find();

  assert.notEqual(firstResult, secondResult, "A new RecordArray was returned");
});
