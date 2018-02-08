// This is a debug adapter for the Ember Extension, don't let the fact this is called an "adapter" confuse you.
// Most copied from: https://github.com/emberjs/data/blob/master/packages/ember-data/lib/system/debug/debug_adapter.js

if (!Ember.DataAdapter) { return; }

var get = Ember.get, capitalize = Ember.String.capitalize, underscore = Ember.String.underscore;

var DebugAdapter = Ember.DataAdapter.extend({
  getFilters: function() {
    return [
      { name: 'isNew', desc: 'New' },
      { name: 'isModified', desc: 'Modified' },
      { name: 'isClean', desc: 'Clean' }
    ];
  },

  detect: function(klass) {
    return klass !== Ember.Model && Ember.Model.detect(klass);
  },

  columnsForType: function(type) {
    var columns = [], count = 0, self = this;
    type.getAttributes().forEach(function(name, meta) {
        if (count++ > self.attributeLimit) { return false; }
        var desc = capitalize(underscore(name).replace('_', ' '));
        columns.push({ name: name, desc: desc });
    });
    return columns;
  },

  getRecords: function(type) {
    var records = [];
    type.forEachCachedRecord(function(record) { records.push(record); });
    return records;
  },

  getRecordColumnValues: function(record) {
    var self = this, count = 0,
        columnValues = { id: get(record, 'id') };

    record.constructor.getAttributes().forEach(function(key) {
      if (count++ > self.attributeLimit) {
        return false;
      }
      var value = get(record, key);
      columnValues[key] = value;
    });
    return columnValues;
  },

  getRecordKeywords: function(record) {
    var keywords = [], keys = Ember.A(['id']);
    record.constructor.getAttributes().forEach(function(key) {
      keys.push(key);
    });
    keys.forEach(function(key) {
      keywords.push(get(record, key));
    });
    return keywords;
  },

  getRecordFilterValues: function(record) {
    return {
      isNew: record.get('isNew'),
      isModified: record.get('isDirty') && !record.get('isNew'),
      isClean: !record.get('isDirty')
    };
  },

  getRecordColor: function(record) {
    var color = 'black';
    if (record.get('isNew')) {
      color = 'green';
    } else if (record.get('isDirty')) {
      color = 'blue';
    }
    return color;
  },

  observeRecord: function(record, recordUpdated) {
    var releaseMethods = Ember.A(), self = this,
        keysToObserve = Ember.A(['id', 'isNew', 'isDirty']);

    record.constructor.getAttributes().forEach(function(key) {
      keysToObserve.push(key);
    });

    keysToObserve.forEach(function(key) {
      var handler = function() {
        recordUpdated(self.wrapRecord(record));
      };
      Ember.addObserver(record, key, handler);
      releaseMethods.push(function() {
        Ember.removeObserver(record, key, handler);
      });
    });

    var release = function() {
      releaseMethods.forEach(function(fn) { fn(); } );
    };

    return release;
  }
});

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: "em-data-adapter",

    initialize: function() {
      var application = arguments[1] || arguments[0];
      application.register('em-data-adapter:main', DebugAdapter);
    }
  });
});
