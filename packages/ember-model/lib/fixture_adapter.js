require('ember-model/adapter');

Ember.FixtureAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var fixtures = record.constructor.FIXTURES,
        data = Ember.A(fixtures).find(function(el) { return el.id === id; });

    if (!record.get('isLoaded')) {
      setTimeout(function() {
        Ember.run(function() {
          record.load(id, data);
        });
      });
    }
  },

  findAll: function(klass, records) {
    var fixtures = klass.FIXTURES;

    setTimeout(function() {
      Ember.run(function() {
        records.load(klass, fixtures);
      });
    });
  },

  createRecord: function(record) {
    var deferred = Ember.Deferred.create();
    deferred.then(function() {
      record.didCreateRecord();
    });
    setTimeout(function() {
      Ember.run(deferred, deferred.resolve, record);
    });
    return deferred;
  },

  saveRecord: function(record) {
    var deferred = Ember.Deferred.create();
    deferred.then(function() {
      record.didSaveRecord();
    });
    setTimeout(function() {
      Ember.run(deferred, deferred.resolve, record);
    });
    return deferred;
  },

  deleteRecord: function(record) {
    var deferred = Ember.Deferred.create();
    deferred.then(function() {
      record.didDeleteRecord();
    });
    setTimeout(function() {
      Ember.run(deferred, deferred.resolve, record);
    });
    return deferred;
  }
});