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