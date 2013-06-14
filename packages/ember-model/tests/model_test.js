var Model, ModelWithoutID;

module("Ember.Model", {
  setup: function() {
    Model = Ember.Model.extend({
      name: Ember.attr()
    });
    Model.primaryKey = 'token';
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {token: 'a', name: 'Erik'}
    ];
    ModelWithoutID = Model.extend();
    ModelWithoutID.adapter = Ember.FixtureAdapter.create();
    ModelWithoutID.FIXTURES = [
      {name: 'Erik'},
      {name: 'Alex'}
    ];
  },
  teardown: function() {

  }
});

test("can define attributes with Ember.attr, data is accessible", function() {
  var instance = Model.create({name: "Erik"});

  equal(instance.get('name'), "Erik", "Property value was retained");
});

test("can handle models without an ID", function() {
  expect(3);
  var records = ModelWithoutID.find();
  stop();
  records.on('didLoad', function() {
    start();
    equal(records.get('length'), 2);
    equal(records.get('firstObject.name'), 'Erik');
    equal(records.get('lastObject.name'), 'Alex');
  });

});

// test("coercion", function() {
// });

test(".find(id) delegates to the adapter's find method", function() {
  expect(6);

  var record = Ember.run(Model, Model.find, 'a');
  ok(record, "Record was returned by find");
  ok(!record.get('isLoaded'));
  ok(record.get('isLoading'));
  stop();

  record.on('didLoad', function() {
    start();
    equal(record.get('name'), 'Erik', "Loaded value is accessible from the record");
    ok(record.get('isLoaded'));
    ok(!record.get('isLoading'));
  });
});

test(".reload() loads the record via the adapter after it was loaded", function() {
  expect(1);

  var record = Ember.run(Model, Model.find, 'a');

  Model.load([{ token: 'a', name: 'Yehuda' }]);

  Ember.run(function() {
    record.reload();
  });

  stop();

  record.on('didLoad', function() {
    start();
    equal(record.get('name'), 'Erik');
  });
});

test(".revert() sets the data back to its saved state", function() {
  expect(3);

  var record = Ember.run(Model, Model.find, 'a');

  record.on('didLoad', function() {
    start();
    record.set('name', 'Brian');
    ok(record.get('isDirty'));
    record.revert();

    equal(record.get('name'), 'Erik');
    ok(!record.get('isDirty'));
  });
  stop();
});

test(".find(id) called multiple times returns the same object (identity map)", function() {
  expect(1);

  var first = Ember.run(Model, Model.find, 'a'),
      second = Ember.run(Model, Model.find, 'a');

  equal(first, second);
});

test("creating a new record adds it to existing record arrays", function() {
  expect(1);

  var records = Model.find();
  var record = Model.create({token: 'b', name: 'Yehuda'});
  record.save();
  stop();

  record.on('didSaveRecord', function() {
    start();
    equal(records.get('length'), 2, "The record array was updated");
  });

});

test("destroying a record removes it from record arrays", function() {
  expect(2);

  var records = Model.find();
  stop();
  records.on('didLoad', function() {
    start();
    equal(records.get('length'), 1, "The record array was updated");
    var record = Model.find('a');
    record.deleteRecord();
    stop();
    record.on('didDeleteRecord', function() {
      start();
      equal(records.get('length'), 0, "The record array was updated");
    });
  });
});

test("record isNew & isSaving flags", function() {
  expect(5);

  var record = Model.create();
  ok(record.get('isNew'));

  record.save();
  ok(record.get('isNew'));
  ok(record.get('isSaving'));

  stop();

  record.on('didSaveRecord', function() {
    start();
    ok(!record.get('isNew'));
    ok(!record.get('isSaving'));
  });
});


test("record.toJSON() is generated from Ember.attr definitions", function() {
  expect(1);

  var record = Ember.run(Model, Model.find, 'a');
  record.on('didLoad', function() {
    start();
    deepEqual(record.toJSON(), {name: 'Erik'});
  });
  stop();
});


test("Model.find() returns a deferred", function() {
  expect(2);

  var records = Ember.run(Model, Model.find);
  records.then(function(data) {
    start();
    equal(records, data);
    ok(data.get('isLoaded'));
  });
  stop();
});

test("Model.find(id) returns a deferred", function() {
  expect(2);

  var record = Ember.run(Model, Model.find, 'a');
  record.then(function(data) {
    start();
    equal(record, data);
    ok(data.get('isLoaded'));
  });
  stop();
});

test("Model#save() returns a deferred", function() {
  expect(2);

  var record = Ember.run(Model, Model.find, 'a');
  record.then(function(data) {
    start();
    record.set('name', 'Stefan');
    record.save().then(function(data) {
      start();
      equal(record, data);
      ok(!record.get('isSaving'));
    });
    stop();
  });
  stop();
});

test("Model#deleteRecord() returns a deferred", function() {
  expect(2);

  var record = Ember.run(Model, Model.find, 'a');
  record.then(function(data) {
    start();
    record.deleteRecord().then(function(data) {
      start();
      equal(record, data);
      ok(record.get('isDeleted'));
    });
    stop();
  });
  stop();
});

test("Model#save() works as expected", function() {
  expect(2);

  var records = Ember.run(Model, Model.find);
  var record = Ember.run(Model, Model.find, 'a');

  records.then(function() {
    start();
    ok(!record.get('isNew'));

    record.set('name', 'Stefan');
    record.save().then(function() {
      start();

      equal(records.get('length'), 1);
    });
    stop();
  });
  stop();
});

test("Model#create() works as expected", function() {
  expect(9);

  var record = Model.create({name: 'Yehuda'});

  ok(record.get('isNew'));
  ok(record.get('isLoaded'));
  ok(!record.get('isSaving'));

  record.save().then(function() {
    start();
    ok(!record.get('isNew'));
    ok(record.get('isLoaded'));
    ok(!record.get('isSaving'));
  });

  ok(record.get('isNew'));
  ok(record.get('isLoaded'));
  ok(record.get('isSaving'));

  stop();
});

// TODO: test that creating a record calls load

// test('Model#registerRecordArray', function(){

// });

// test('Model#unregisterRecordArray', function(){

// });
