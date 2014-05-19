var FixtureModel, adapter;

module("Ember.FixtureAdapter", {
  setup: function() {
    FixtureModel = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });
    adapter = FixtureModel.adapter = Ember.FixtureAdapter.create();
  }
});

test("fetch loads the full FIXTURES payload when id isn't specified", function() {
  expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];
    
  FixtureModel.FIXTURES = data;

  FixtureModel.fetch().then(function(records) {
    start();
    equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
  });

  stop();
});

test("fetch loads the desired FIXTURE payload when the id (int) is specified", function() {
  expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];

  FixtureModel.FIXTURES = data;

  Ember.run(FixtureModel, FixtureModel.fetch, [1]).then(function(records) {
    start();
    equal(records.get('length'), 1, "The proper number of items should have been loaded.");
  });

  stop();
});

test("fetch loads the desired FIXTURE payload when the id (string) is specified", function() {
  expect(1);

  var data = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Aaron'}
    ];

  FixtureModel.FIXTURES = data;

  Ember.run(FixtureModel, FixtureModel.fetch, ["1"]).then(function(records) {
    start();
    equal(records.get('length'), 1, "The proper number of items should have been loaded.");
  });

  stop();
});

test("createRecord", function() {
  expect(3);

  FixtureModel.FIXTURES = [];

  var record = FixtureModel.create({name: "Erik"});

  ok(record.get('isNew'), "Record should be new");
  ok(!record.get('id'), "Record #id should be undefined");

  // Ember.run(record, record.save);
  Ember.run(record, record.save).then(function(record) {
    start();
    equal(record.get('id'), "fixture-0", "Value to Record #id should be assigned");
  });
  stop();
});

test("revert", function() {
  expect(6);

  FixtureModel.FIXTURES = [];

  var record = FixtureModel.create({name: "Erik"});

  // Ember.run(record, record.save);
  Ember.run(record, record.save).then(function(record) {
    start();
    // test revert of a clean record
    record.revert();
    equal(record.get('isDirty'), false, "Reverted clean record should not be dirty");
    equal(record.get('id'), "fixture-0", "Value of clean Record #id should not have changed");
    equal(record.get('name'), "Erik", "Value of clean Record #name should not have changed");
    // test revert of a dirty model
    record.set('name', 'Peter');
    record.revert();
    equal(record.get('isDirty'), false, "Reverted dirty record should not be dirty");
    equal(record.get('id'), "fixture-0", "Value of dirty Record #id should not have changed");
    equal(record.get('name'), "Erik", "Value of dirty Record #name should have reverted");
  });
  stop();
});

test("_generatePrimaryKey", function() {
  expect(3);

  equal(adapter._generatePrimaryKey(), "fixture-0", "Return next primary key");
  equal(adapter._generatePrimaryKey(), "fixture-1", "Return next primary key");
  equal(adapter._generatePrimaryKey(), "fixture-2", "Return next primary key");
});
