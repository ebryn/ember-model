require('ember-model/adapter');

var get = Ember.get,
    set = Ember.set;

Ember.FixtureAdapter = Ember.Adapter.extend({
  _counter: 0,
  _findData: function(klass, id, subgraph) {
    var fixtures = klass.FIXTURES,
        idAsString = id.toString(),
        primaryKey = get(klass, 'primaryKey'),
        data = Ember.A(fixtures).find(function(el) { return (el[primaryKey]).toString() === idAsString; }),
        meta,
        key,
        keys,
        res;

    res = Ember.merge({}, data);
    if(subgraph) {
      keys = Object.keys(subgraph);
      res = {};
      for(var i = 0; i < keys.length; i++) {
        meta = klass.metaForProperty(keys[i]);
        key = meta.key || keys[i];
        res[key] = data[key];
      }
    }
    return res;
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

  find: function(record, id, subgraph) {
    var data = this._findData(record.constructor, id, subgraph);
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        Ember.run(record, record.load, id, data, subgraph);
        resolve(record);
      }, 0);
    });
  },

  findMany: function(klass, records, ids, subgraph) {
    var fixtures = klass.FIXTURES,
        requestedData = [];

    for (var i = 0, l = ids.length; i < l; i++) {
      requestedData.push(this._findData(klass, ids[i], subgraph));
    }

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        Ember.run(records, records.load, klass, requestedData, subgraph);
        resolve(records);
      }, 0);
    });
  },

  findAll: function(klass, records, subgraph) {
    var keys = subgraph ? Object.keys(subgraph) : null,
        fixtures = klass.FIXTURES.map(function(data) {
          var res;
          if(subgraph) {
            res = {}; 
            for (var i = 0, l = keys.length; i < l; i++) {
              res[keys[i]] = data[keys[i]];
            }
          } else {
            res = Ember.merge({}, data);
          }
          return res;
        });

    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        Ember.run(records, records.load, klass, fixtures, subgraph);
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
        var rootKey = record.constructor.rootKey,
            json;

        self._setPrimaryKey(record);
        json = rootKey ? record.toJSON()[rootKey] : record.toJSON();
        fixtures.push(klass.findFromCacheOrLoad(json));
        record.didCreateRecord();
        resolve(record);
      }, 0);
    });
  },

  saveRecord: function(record) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        record.didSaveRecord();
        resolve(record);
      }, 0);
    });
  },

  deleteRecord: function(record) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      Ember.run.later(this, function() {
        record.didDeleteRecord();
        resolve(record);
      }, 0);
    });
  }
});
