var Model;

module("Ember.FilteredRecordArray", {
  setup: function() {
    Model = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {id:     1, name: 'Erik'},
      {id:     2, name: 'Stefan'},
      {id: 'abc', name: 'Charles'}
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

test("must be created with a filterProperties property", function() {
  throws(function() {
    Ember.FilteredRecordArray.create({modelClass: Model, filterFunction: Ember.K});
  }, /FilteredRecordArrays must be created with filterProperties/);
});


test("with a noop filter will return all the loaded records", function() {
  expect(1);

  Model.fetch().then(function() {
    start();

    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: Ember.K,
      filterProperties: []
    });

    equal(recordArray.get('length'), 3, "There are 3 records");
  });

  stop();
});

test("with a filter will return only the relevant loaded records", function() {
  expect(2);

  Model.fetch().then(function() {
    start();

    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik';
      },
      filterProperties: ['name']
    });

    equal(recordArray.get('length'), 1, "There is 1 record");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
  });

  stop();
});

test("will include relevant records fetched after the filter was created", function() {
  expect(2);

  var recordArray = Ember.FilteredRecordArray.create({
    modelClass: Model,
    filterFunction: function(record) {
      return record.get('name') === 'Erik';
    },
    filterProperties: ['name']
  });

  Model.fetch().then(function() {
    start();
    equal(recordArray.get('length'), 1, "There is 1 record");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
  });

  stop();
});

test("creating a record that doesn't match the filter after creating a FilteredRecordArray shouldn't change the content", function() {
  expect(2);

  Model.fetch().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik';
      },
      filterProperties: ['name']
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

test("creating a record that matches the filter after creating a FilteredRecordArray should update the content of it", function() {
  expect(3);

  Model.fetch().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik' || record.get('name') === 'Kris';
      },
      filterProperties: ['name']
    });

    Model.create({id: 3, name: 'Kris'}).save().then(function(record) {
      start();
      equal(recordArray.get('length'), 2, "There are 2 records");
      equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
      equal(recordArray.get('lastObject.name'), 'Kris', "The record data matches");
    });
    stop();
  });

  stop();
});

test("unloading a record that matches the filter should remove the record from the FilteredRecordArray", function() {
  expect(4);

  Model.fetch().then(function() {
    start();

    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name') === 'Erik';
      },
      filterProperties: ['name']
    });

    equal(recordArray.get('length'), 1, "There is 1 record");
    var model = recordArray.get('firstObject');
    equal(Ember.observersFor(model, 'name').length, 1, "There is 1 name observer");
    Model.unload(model);
    equal(recordArray.get('length'), 0, "There are 0 records");
    equal(Ember.observersFor(model, 'name').length, 0, "There are 0 name observers");
  });

  stop();
});

test("changing a property that matches the filter should update the FilteredRecordArray to include it", function() {
  expect(5);
  Model.fetch().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name').match(/^E/);
      },
      filterProperties: ['name']
    });

    equal(recordArray.get('length'), 1, "There is 1 record initially");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");

    Model.fetch(2).then(function(record) {
      start();
      record.set('name', 'Estefan');

      equal(recordArray.get('length'), 2, "There are 2 records after changing the name");
      equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
      equal(recordArray.get('lastObject.name'), 'Estefan', "The record data matches");
    });
    stop();
  });

  stop();
});

test("adding a new record and changing a property that matches the filter should update the FilteredRecordArray to include it", function() {
  expect(5);

  Model.fetch().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        var name = record.get('name');
        return name && name.match(/^E/);
      },
      filterProperties: ['name']
    });

    equal(recordArray.get('length'), 1, "There is 1 record initially");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");

    Model.create({id: 3, name: 'Kris'}).save().then(function(record) {
      start();
      record.set('name', 'Ekris');

      equal(recordArray.get('length'), 2, "There are 2 records after changing the name");
      equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
      equal(recordArray.get('lastObject.name'), 'Ekris', "The record data matches");
    });
    stop();
  });

  stop();
});

test("loading JSON for a new record updates the FilteredRecordArray as expected", function() {
  expect(5);

  Model.fetch().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name').match(/^E/);
      },
      filterProperties: ['name']
    });

    equal(recordArray.get('length'), 1, "There is 1 record initially");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");

    Model.mergeOrLoad({ id: 3, name: 'Ekris' });

    equal(recordArray.get('length'), 2, "There are 2 records after loading JSON for a new model");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");
    equal(recordArray.get('lastObject.name'), 'Ekris', "The record data matches");
  });

  stop();
});

test("loading JSON for an existing record updates the FilteredRecordArray as expected", function() {
  expect(4);

  Model.fetch().then(function() {
    start();
    var recordArray = Ember.FilteredRecordArray.create({
      modelClass: Model,
      filterFunction: function(record) {
        return record.get('name').match(/^E/);
      },
      filterProperties: ['name']
    });

    equal(recordArray.get('length'), 1, "There is 1 record initially");
    equal(recordArray.get('firstObject.name'), 'Erik', "The record data matches");

    Model.mergeOrLoad({ id: 1, name: 'Erik Updated' });

    equal(recordArray.get('length'), 1, "There is 1 record after loading JSON for an existing model");
    equal(recordArray.get('firstObject.name'), 'Erik Updated', "The record data matches");
  });

  stop();
});
