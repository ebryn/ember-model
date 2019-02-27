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
    assert.equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
    done();
  });
});

QUnit.test("fetch loads the desired FIXTURE payload when the id (int) is specified", function(assert) {
  assert.expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];

  FixtureModel.FIXTURES = data;

  var done = assert.async();
  Ember.run(FixtureModel, FixtureModel.fetch, [1]).then(function(records) {
    assert.equal(records.get('length'), 1, "The proper number of items should have been loaded.");
    done();
  });
});

QUnit.test("fetch loads the desired FIXTURE payload when the id (string) is specified", function(assert) {
  assert.expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];

  FixtureModel.FIXTURES = data;

  var done = assert.async();
  Ember.run(FixtureModel, FixtureModel.fetch, ["1"]).then(function(records) {
    assert.equal(records.get('length'), 1, "The proper number of items should have been loaded.");
    done();
  });
});

QUnit.test("createRecord", function(assert) {
  assert.expect(3);

  FixtureModel.FIXTURES = [];

  var record = FixtureModel.create({name: "Erik"});
  Ember.setOwner(record, Ember.getOwner(FixtureModel));

  assert.ok(record.get('isNew'), "Record should be new");
  assert.ok(!record.get('id'), "Record #id should be undefined");

  // Ember.run(record, record.save);
  var done = assert.async();
  Ember.run(record, record.save).then(function(record) {
    assert.equal(record.get('id'), "fixture-0", "Value to Record #id should be assigned");
    done();
  });
});

QUnit.test("createRecord - handle the case when the `rootKey` property is set", function(assert) {
  assert.expect(1);

  FixtureModel.rootKey = "fixture";
  FixtureModel.FIXTURES = [];

  var record = FixtureModel.create({name: "Erik"});
  Ember.setOwner(record, Ember.getOwner(FixtureModel));

  var done = assert.async();

  Ember.run(record, record.save).then(function () {
    var record = FixtureModel.find("fixture-0");
    assert.deepEqual(record.get("_data"), {id: "fixture-0", name: "Erik"}, "Data is set correctly");
    done();
  });
});

QUnit.test("_generatePrimaryKey", function(assert) {
  assert.expect(3);

  assert.equal(adapter._generatePrimaryKey(), "fixture-0", "Retrun next primary key");
  assert.equal(adapter._generatePrimaryKey(), "fixture-1", "Retrun next primary key");
  assert.equal(adapter._generatePrimaryKey(), "fixture-2", "Retrun next primary key");
});
