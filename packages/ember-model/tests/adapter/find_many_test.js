QUnit.module("Ember.Adapter#findMany");

QUnit.test(".find([]) delegates to the adapter's findMany method", function(assert) {
  assert.expect(8);

  var Model = Ember.Model.extend();
  Model.adapter = {
    findMany: function(klass, adapterRecords, ids) {
      assert.equal(klass, Model, "Class is passed into Adapter#findMany");
      assert.ok(adapterRecords instanceof Ember.RecordArray, "RecordArray is passed into Adapter#findMany");
      assert.deepEqual(ids, [1,2,3], "IDs are passed into Adapter#findMany");

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

  assert.ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  assert.ok(!records.get('isLoaded'), "RecordArray isn't initially loaded");
  assert.equal(records.get('length'), 0, "RecordArray is empty when not resolved yet");

  var done = assert.async();
  records.one('didLoad', function() {
    done();
    assert.equal(records.get('length'), 3, "RecordArray#length is 3 after resolved");
    assert.ok(records.get('isLoaded'), "RecordArray is loaded after resolved");
  });
});

