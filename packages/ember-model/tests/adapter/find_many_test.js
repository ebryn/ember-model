module("Ember.Adapter#findMany");

test(".find([]) delegates to the adapter's findMany method", function() {
  expect(8);

  var Model = Ember.Model.extend();
  Model.adapter = {
    findMany: function(klass, adapterRecords, ids) {
      equal(klass, Model, "Class is passed into Adapter#findMany");
      ok(adapterRecords instanceof Ember.RecordArray, "RecordArray is passed into Adapter#findMany");
      deepEqual(ids, [1,2,3], "IDs are passed into Adapter#findMany");

      return new Ember.RSVP.Promise(function(resolve, reject) {
        setTimeout(function() {
          Ember.run(adapterRecords, adapterRecords.load, klass, []);
          resolve(adapterRecords);
        });
      });
    }
  };

  var records;

  Ember.run(function() {
    records = Model.find([1,2,3]);
  });

  ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  ok(!records.get('isLoaded'), "RecordArray isn't initially loaded");
  equal(records.get('length'), 0, "RecordArray is empty when not resolved yet");

  stop();
  records.one('didLoad', function() {
    start();
    equal(records.get('length'), 3, "RecordArray#length is 3 after resolved");
    ok(records.get('isLoaded'), "RecordArray is loaded after resolved");
  });
});

