QUnit.module("Ember.Adapter#findQuery");

QUnit.test(".find({}) delegates to the adapter's findQuery method", function(assert) {
  assert.expect(7);

  var Model = Ember.Model.extend();
  Model.adapter = {
    findQuery: function(klass, records, params) {
      assert.equal(klass, Model, "Class is passed into Adapter#findQuery");
      assert.ok(records instanceof Ember.RecordArray, "RecordArray is passed into Adapter#findQuery");
      assert.deepEqual(params, {query: "derp"}, "Query params are passed into Adapter#findQuery");

      setTimeout(function() {
        Ember.run(records, records.load, klass, []);
      });
    }
  };

  var records = Model.find({query: "derp"});
  assert.ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  assert.ok(!records.get('isLoaded'), "RecordArray isn't initially loaded");
  assert.ok(!(Model.recordArrays || Ember.A()).includes(records), "The RecordArray created by a findQuery should not be registered");

  var done = assert.async();
  records.one('didLoad', function() {
    done();
    assert.ok(records.get('isLoaded'), "RecordArray is loaded after resolved");
  });
});
