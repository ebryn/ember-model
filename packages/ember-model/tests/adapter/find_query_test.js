module("Ember.Adapter#findQuery");

test(".find({}) delegates to the adapter's findQuery method", function() {
  expect(7);

  var Model = Ember.Model.extend();
  Model.adapter = {
    findQuery: function(klass, records, params) {
      equal(klass, Model, "Class is passed into Adapter#findQuery");
      ok(records instanceof Ember.RecordArray, "RecordArray is passed into Adapter#findQuery");
      deepEqual(params, {query: "derp"}, "Query params are passed into Adapter#findQuery");

      setTimeout(function() {
        Ember.run(records, records.load, klass, []);
      });
    }
  };

  var records = Model.find({query: "derp"});
  ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  ok(!records.get('isLoaded'), "RecordArray isn't initially loaded");
  ok(!(Model.recordArrays || Ember.A()).contains(records), "The RecordArray created by a findQuery should not be registered");

  stop();
  records.one('didLoad', function() {
    start();
    ok(records.get('isLoaded'), "RecordArray is loaded after resolved");
  });
});

