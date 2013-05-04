require('ember-model/adapter');

Ember.FixtureAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var fixtures = record.constructor.FIXTURES,
        data = Ember.A(fixtures).find(function(el) { return el.id === id; });

    if (!record.get('isLoaded')) {
      setTimeout(function() {
        Ember.run(record, record.load, id, data);
      });
    }
  },

  findMany: function(klass, records, ids) {
    var fixtures = klass.FIXTURES,
        requestedData = [];

    for (var i = 0, l = ids.length; i < l; i++) {
      requestedData.push(fixtures[i]);
    }

    setTimeout(function() {
      Ember.run(records, records.load, klass, requestedData);
    });
  },

  findAll: function(klass, records) {
    var fixtures = klass.FIXTURES;

    setTimeout(function() {
      Ember.run(records, records.load, klass, fixtures);
    });
  },

  createRecord: function(record) {
    var klass = record.constructor,
        fixtures = klass.FIXTURES;

    setTimeout(function() {
      Ember.run(function() {
        fixtures.push(klass.findFromCacheOrLoad(record.toJSON()));
        record.didCreateRecord();
      });
    });

    return record;
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