module("find coalescing");

test("multiple calls to Model#find within the same run loop coalesce into a findMany call", function() {
  expect(2);

  var Model = Ember.Model.extend();

  Model.adapter = {
    find: function() {
      ok(false, "find was called");
    },

    findMany: function(klass, records, ids) {
      ok(true, "findMany was called");
      deepEqual(ids, [1,2,3], "The correct ids were passed into findMany");
    }
  };

  Ember.run(function() {
    Model.find(1);
    Model.find(2);
    Model.find(3);
  });
});

test("coalesced findMany call should only include records which aren't loaded in the identity map", function() {
  expect(2);

  var Model = Ember.Model.extend({
    id: Ember.attr()
  });

  Model.adapter = {
    findMany: function(klass, records, ids) {
      ok(true, "findMany was called");
      deepEqual(ids, [2,3], "The correct ids were passed into findMany");
    }
  };

  var record = Model.create({ id: 1 });
  Ember.run(record, record.didCreateRecord);
  Ember.run(record, record.load, 1);

  Ember.run(function() {
    Model.find([1, 2, 3]);
  });
});

test("coalesced findMany returns a resolved promise even if all records are loaded from cache", function() {
  expect(1);

  var Model = Ember.Model.extend({
    id: Ember.attr()
  });

  Model.adapter = {
    findMany: function(klass, records, ids) {
      ok(false, "findMany shouldn't be called");
    }
  };

  var record = Model.create({ id: 1 });
  Ember.run(record, record.didCreateRecord);
  Ember.run(record, record.load, 1);

  var record2 = Model.create({ id: 2 });
  Ember.run(record2, record.didCreateRecord);
  Ember.run(record2, record.load, 2);

  var records = Ember.run(Model, Model.find, [1, 2]),
      promise = Ember.run(Ember, Ember.loadPromise, records);

  Ember.run(function() {
    promise.then(function(records) {
      equal(records.get("length"), 2);
    });
  });
});


test("calls to Model#find and Model#findMany within the same run loop coalesce into a single findMany call", function() {
  expect(2);

  var Model = Ember.Model.extend();

  Model.adapter = {
    find: function() {
      ok(false, "find was called");
    },

    findMany: function(klass, records, ids) {
      ok(true, "findMany was called");
      deepEqual(ids, [1,2,3], "The correct ids were passed into findMany");
    }
  };

  Ember.run(function() {
    Model.find(1);
    Model.find([2, 3]);
  });
});

test("should unique IDs", function() {
  expect(2);

  var Model = Ember.Model.extend();

  Model.adapter = {
    find: function() {
      ok(false, "find was called");
    },

    findMany: function(klass, records, ids) {
      ok(true, "findMany was called");
      deepEqual(ids, [1,2,3], "The correct ids were passed into findMany");
      records.load(klass, []);
    }
  };

  Ember.run(function() {
    Model.find(1);
    Model.find(1);
    Model.find([2, 3]);
    Model.find([1, 2, 3]);
  });
});

test("should resolve all RecordArrays", function() {
  expect(2);

  var Model = Ember.Model.extend();

  Model.adapter = {
    findMany: function(klass, records, ids) {
      records.load(klass, []);
    }
  };

  var recordArray1, recordArray2;

  Ember.run(function() {
    Model.find(1);
    Model.find(1);
    recordArray1 = Model.find([2, 3]);
    recordArray2 = Model.find([1, 2, 3]);

    Ember.loadPromise(recordArray1).then(function() {
      ok(true, "The first RecordArray returned from findMany was loaded");
    });

    Ember.loadPromise(recordArray2).then(function() {
      ok(true, "The second RecordArray returned from findMany was loaded");
    });
  });
});
