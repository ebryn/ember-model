var FixtureModel, adapter;

QUnit.module("Ember.FixtureAdapter", {
  beforeEach: function() {
    FixtureModel = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });
    adapter = FixtureModel.adapter = Ember.FixtureAdapter.create();
  }
});

QUnit.test("fetch loads the full FIXTURES payload when id isn't specified", function(assert) {
  assert.expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];
    
  FixtureModel.FIXTURES = data;

  FixtureModel.fetch().then(function(records) {
    done();
    assert.equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
  });

  var done = assert.async();
});

QUnit.test("fetch loads the desired FIXTURE payload when the id (int) is specified", function(assert) {
  assert.expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];

  FixtureModel.FIXTURES = data;

  Ember.run(FixtureModel, FixtureModel.fetch, [1]).then(function(records) {
    done();
    assert.equal(records.get('length'), 1, "The proper number of items should have been loaded.");
  });

  var done = assert.async();
});

QUnit.test("fetch loads the desired FIXTURE payload when the id (string) is specified", function(assert) {
  assert.expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];

  FixtureModel.FIXTURES = data;

  Ember.run(FixtureModel, FixtureModel.fetch, ["1"]).then(function(records) {
    done();
    assert.equal(records.get('length'), 1, "The proper number of items should have been loaded.");
  });

  var done = assert.async();
});

QUnit.test("createRecord", function(assert) {
  assert.expect(3);

  FixtureModel.FIXTURES = [];

  var record = FixtureModel.create({name: "Erik"});

  assert.ok(record.get('isNew'), "Record should be new");
  assert.ok(!record.get('id'), "Record #id should be undefined");

  // Ember.run(record, record.save);
  Ember.run(record, record.save).then(function(record) {
    done();
    assert.equal(record.get('id'), "fixture-0", "Value to Record #id should be assigned");
  });
  var done = assert.async();
});

QUnit.test("createRecord - handle the case when the `rootKey` property is set", function(assert) {
  assert.expect(1);

  FixtureModel.rootKey = "fixture";
  FixtureModel.FIXTURES = [];

  var record = FixtureModel.create({name: "Erik"});

  Ember.run(record, record.save).then(function () {
    done();
    var record = FixtureModel.find("fixture-0");
    assert.deepEqual(record.get("_data"), {id: "fixture-0", name: "Erik"}, "Data is set correctly");
  });
  var done = assert.async();
});

QUnit.test("_generatePrimaryKey", function(assert) {
  assert.expect(3);

  assert.equal(adapter._generatePrimaryKey(), "fixture-0", "Retrun next primary key");
  assert.equal(adapter._generatePrimaryKey(), "fixture-1", "Retrun next primary key");
  assert.equal(adapter._generatePrimaryKey(), "fixture-2", "Retrun next primary key");
});
