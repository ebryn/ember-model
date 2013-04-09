module("Ember.Adapter#findMany");

test(".find([]) delegates to the adapter's findMany method", function() {
  expect(6);

  var Model = Ember.Model.extend();
  Model.adapter = {
    findMany: function(klass, adapterRecords, ids) {
      equal(klass, Model, "Class is passed into Adapter#findMany");
      ok(adapterRecords instanceof Ember.RecordArray, "RecordArray is passed into Adapter#findMany");
      deepEqual(ids, [1,2,3], "IDs are passed into Adapter#findMany");

      setTimeout(function() {
        Ember.run(adapterRecords, adapterRecords.load, klass, []);
      });
    }
  };

  var records;

  Ember.run(function() {
    records = Model.find([1,2,3]);
  });

  ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  ok(!records.get('isLoaded'), "RecordArray isn't initially loaded");

  stop();
  Ember.run(records, records.then, function() {
    start();
    ok(records.get('isLoaded'), "RecordArray is loaded after resolved");
  });
});

