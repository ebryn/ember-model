require('ember-model/adapter');

var get = Ember.get;

Ember.FixtureAdapter = Ember.Adapter.extend({
  _findData: function(klass, id) {
    var fixtures = klass.FIXTURES,
        primaryKey = get(klass, 'primaryKey'),
        data = Ember.A(fixtures).find(function(el) { return el[primaryKey] === id; });

    return data;
  },

  find: function(record, id) {
    var data = this._findData(record.constructor, id);

    if (!record.get('isLoaded')) {
      setTimeout(function() {
        Ember.run(record, record.load, id, data);
      });
    }

    return record;
  },

  findMany: function(klass, records, ids) {
    var fixtures = klass.FIXTURES,
        requestedData = [];

    for (var i = 0, l = ids.length; i < l; i++) {
      requestedData.push(this._findData(klass, ids[i]));
    }

    setTimeout(function() {
      Ember.run(records, records.load, klass, requestedData);
    });

    return records;
  },

  findAll: function(klass, records) {
    var fixtures = klass.FIXTURES;

    setTimeout(function() {
      Ember.run(records, records.load, klass, fixtures);
    });

    return records;
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
