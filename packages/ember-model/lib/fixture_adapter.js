require('ember-model/adapter');

var get = Ember.get;

Ember.FixtureAdapter = Ember.Adapter.extend({
  _findData: function(klass, id) {
    var fixtures = klass.FIXTURES,
        idAsString = id.toString(),
        primaryKey = get(klass, 'primaryKey'),
        data = Ember.A(fixtures).find(function(el) { return (el[primaryKey]).toString() === idAsString; });

    return data;
  },

  find: function(record, id) {
    var data = this._findData(record.constructor, id);

    return new Ember.RSVP.Promise(function(resolve, reject) {
      setTimeout(function() {
        Ember.run(record, record.load, id, data);
        resolve(record);
      });
    });
  },

  findMany: function(klass, records, ids) {
    var fixtures = klass.FIXTURES,
        requestedData = [];

    for (var i = 0, l = ids.length; i < l; i++) {
      requestedData.push(this._findData(klass, ids[i]));
    }

    return new Ember.RSVP.Promise(function(resolve, reject) {
      setTimeout(function() {
        Ember.run(records, records.load, klass, requestedData);
        resolve(records);
      });
    });
  },

  findAll: function(klass, records) {
    var fixtures = klass.FIXTURES;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      setTimeout(function() {
        Ember.run(records, records.load, klass, fixtures);
        resolve(records);
      });
    });
  },

  createRecord: function(record) {
    var klass = record.constructor,
        fixtures = klass.FIXTURES;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      setTimeout(function() {
        fixtures.push(klass.findFromCacheOrLoad(record.toJSON()));
        record.didCreateRecord();
        resolve(record);
      });
    });
  },

  saveRecord: function(record) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      setTimeout(function() {
        record.didSaveRecord();
        resolve(record);
      });
    });
  },

  deleteRecord: function(record) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      setTimeout(function() {
        record.didDeleteRecord();
        resolve(record);
      });
    });
  }
});
