require('ember-model/adapter');

var get = Ember.get,
    set = Ember.set;

Ember.FixtureAdapter = Ember.Adapter.extend({
  _counter: 0,
  _findData: function(klass, id) {
    var fixtures = klass.FIXTURES,
        idAsString = id.toString(),
        primaryKey = get(klass, 'primaryKey'),
        data = Ember.A(fixtures).find(function(el) { return (el[primaryKey]).toString() === idAsString; });

    return data;
  },

  _setPrimaryKey: function(record) {
    var klass = record.constructor,
        fixtures = klass.FIXTURES,
        primaryKey = get(klass, 'primaryKey');


    if(record.get(primaryKey)) {
      return;
    }

    set(record, primaryKey, this._generatePrimaryKey());
  },

  _generatePrimaryKey: function() {
    var counter = this.get("_counter");

    this.set("_counter", counter + 1);

    return "fixture-" + counter;
  },

  find: function(record, id) {
    var data = this._findData(record.constructor, id);

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        Ember.run(record, record.load, id, data);
        resolve(record);
      }, 0);
    });
  },

  findMany: function(klass, records, ids) {
    var fixtures = klass.FIXTURES,
        requestedData = [];

    for (var i = 0, l = ids.length; i < l; i++) {
      requestedData.push(this._findData(klass, ids[i]));
    }

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        Ember.run(records, records.load, klass, requestedData);
        resolve(records);
      }, 0);
    });
  },

  findAll: function(klass, records) {
    var fixtures = klass.FIXTURES;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        Ember.run(records, records.load, klass, fixtures);
        resolve(records);
      }, 0);
    });
  },

  createRecord: function(record) {
    var klass = record.constructor,
        fixtures = klass.FIXTURES,
        self = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        var data;

        self._setPrimaryKey(record);
        data = record.toJSON();
        fixtures.push(klass.findFromCacheOrLoad(data));
        self.didCreateRecord(record, data);
        resolve(record);
      }, 0);
    });
  },

  didCreateRecord: function(record, data) {
    this._loadRecordFromData(record, data);
    record.didCreateRecord();
  },

  saveRecord: function(record) {
    var self = this, data = record.toJSON();

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        self.didSaveRecord(record, data);
        resolve(record);
      }, 0);
    });
  },

  didSaveRecord: function(record, data) {
    this._loadRecordFromData(record, data);
    record.didSaveRecord();
  },

  deleteRecord: function(record) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        record.didDeleteRecord();
        resolve(record);
      }, 0);
    });
  },

  _loadRecordFromData: function(record, data) {
    var rootKey = get(record.constructor, 'rootKey'),
        primaryKey = get(record.constructor, 'primaryKey'),
        dataToLoad = rootKey ? get(data, rootKey) : data;
    if (!Ember.isEmpty(dataToLoad)) {
      record.load(dataToLoad[primaryKey], dataToLoad);
    }
  }
});
