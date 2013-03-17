var Model;

module("Ember.FilteredRecordArray", {
  setup: function() {
    Model = Ember.Model.extend({
      name: Ember.attr()
    });
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Stefan'}
    ];
  },
  teardown: function() { }
});

test("must be created with a modelClass property", function() {
  throws(function() {
    Ember.FilteredRecordArray.create();
  }, /FilteredRecordArrays must be created with a modelClass/);
});


test("must be created with a filterFunction property", function() {
  throws(function() {
    Ember.FilteredRecordArray.create({modelClass: Model});
  }, /FilteredRecordArrays must be created with a filterFunction/);
});

test("with a noop filter will return all the loaded records", function() {
  expect(1);

  Model.find().then(function() {
    start();

    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: Ember.K
    });

    equal(recordArray.get('length'), 2, "There are 2 records");
  });
  
  stop();
});

test("with a filter will return only the relevant loaded records", function() {
  expect(2);

  Model.find().then(function() {
    start();

    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik';
      }
    });

    equal(recordArray.get('length'), 1, "There is 1 record");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
  });

  stop();
});

test("loading a record that doesn't match the filter after creating a FilteredRecordArray shouldn't change the content", function() {
  expect(2);

  Model.find().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik';
      }
    });

    Model.create({id: 3, name: 'Kris'}).save().then(function(record) {
      start();
      equal(recordArray.get('length'), 1, "There is still 1 record");
      equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
    });
    stop();
  });

  stop();
});

test("loading a record that matches the filter after creating a FilteredRecordArray should update the content of it", function() {
  expect(2);

  Model.find().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik' || record.get('name') === 'Kris';
      }
    });

    Model.create({id: 3, name: 'Kris'}).save().then(function(record) {
      start();
      equal(recordArray.get('length'), 2, "There is still 1 record");
      equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
      equal(recordArray.get('lastObject.name'), 'Kris', "The record data matches");
    });
    stop();
  });

  stop();
});