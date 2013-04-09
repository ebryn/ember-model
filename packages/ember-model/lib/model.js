require('ember-model/adapter');
require('ember-model/record_array');

var get = Ember.get,
    set = Ember.set;

Ember.run.queues.push('data');

Ember.Model = Ember.Object.extend(Ember.Evented, Ember.DeferredMixin, {
  isLoaded: true,
  isLoading: Ember.computed.not('isLoaded'),
  isNew: true,
  isDeleted: false,

  load: function(id, hash) {
    var data = Ember.merge({id: id}, hash);
    set(this, 'data', data);
    set(this, 'isLoaded', true);
    set(this, 'isNew', false);
    this.trigger('didLoad');
    this.resolve(this);
  },

  didDefineProperty: function(proto, key, value) {
    if (value instanceof Ember.Descriptor) {
      var meta = value.meta();

      if (meta.isAttribute) {
        if (!proto.attributes) { proto.attributes = []; }
        proto.attributes.push(key);
      }
    }
  },

  toJSON: function() {
    return this.getProperties(this.attributes);
  },

  save: function() {
    var adapter = this.constructor.adapter;
    set(this, 'isSaving', true);
    return get(this, 'isNew') ? adapter.createRecord(this) : adapter.saveRecord(this);
  },

  didCreateRecord: function() {
    set(this, 'isNew', false);
    this.load(this.get('id'), this.getProperties(this.attributes));
    this.constructor.addToRecordArrays(this);
    this.trigger('didCreateRecord');
    this.didSaveRecord();
  },

  didSaveRecord: function() {
    set(this, 'isSaving', false);
    this.trigger('didSaveRecord');
  },

  deleteRecord: function() {
    return this.constructor.adapter.deleteRecord(this);
  },

  didDeleteRecord: function() {
    this.constructor.removeFromRecordArrays(this);
    set(this, 'isDeleted', true);
    this.trigger('didDeleteRecord');
  }
});

Ember.Model.reopenClass({
  adapter: Ember.Adapter.create(),

  find: function(id) {
    if (!arguments.length) {
      return this.findAll();
    } else if (Ember.typeOf(id) === 'array') {
      return this.findMany(id);
    } else if (typeof id === 'object') {
      return this.findQuery(id);
    } else {
      return this.findById(id);
    }
  },

  findMany: function(ids) {
    var records = Ember.RecordArray.create();

    if (!this.recordArrays) { this.recordArrays = []; }
    this.recordArrays.push(records);

    if (this._currentBatchIds) {
      this._currentBatchIds = this._currentBatchIds.concat(ids);
      this._currentBatchRecordArrays.push(records);
    } else {
      this._currentBatchIds = ids;
      this._currentBatchRecordArrays = [records];
    }

    Ember.run.scheduleOnce('data', this, this._executeBatch);

    return records;
  },

  findAll: function() {
    if (this._findAllRecordArray) { return this._findAllRecordArray; }

    var records = this._findAllRecordArray = Ember.RecordArray.create();

    this.adapter.findAll(this, records);

    return records;
  },

  _currentBatchIds: null,
  _currentBatchRecordArrays: null,

  findById: function(id) {
    var record = this.cachedRecordForId(id),
        adapter = get(this, 'adapter');

    if (!get(record, 'isLoaded')) {
      if (adapter.findMany) {
        if (this._currentBatchIds) {
          this._currentBatchIds.push(id);
        } else {
          this._currentBatchIds = [id];
          this._currentBatchRecordArrays = [];
        }

        Ember.run.scheduleOnce('data', this, this._executeBatch);
      } else {
        adapter.find(record, id);
      }
    }
    return record;
  },

  _executeBatch: function() {
    var batchIds = this._currentBatchIds,
        batchRecordArrays = this._currentBatchRecordArrays,
        records;

    this._currentBatchIds = null;
    this._currentBatchRecordArrays = null;

    if (batchIds.length === 1) {
      get(this, 'adapter').find(this.recordCache[batchIds[0]], batchIds[0]);
    } else {
      records = Ember.RecordArray.create(),
      get(this, 'adapter').findMany(this, records, batchIds);
      records.then(function() {
        for (var i = 0, l = batchRecordArrays.length; i < l; i++) {
          batchRecordArrays[i].notifyLoaded();
        }
      });
    }
  },

  findQuery: function(params) {
    var records = Ember.RecordArray.create();

    this.adapter.findQuery(this, records, params);

    return records;
  },

  cachedRecordForId: function(id) {
    if (!this.recordCache) { this.recordCache = {}; }
    var sideloadedData = this.sideloadedData && this.sideloadedData[id];
    var record = this.recordCache[id] || (sideloadedData ? this.create(sideloadedData) : this.create({isLoaded: false}));
    if (!this.recordCache[id]) { this.recordCache[id] = record; }
    return record;
  },

  addToRecordArrays: function(record) {
    if (this._findAllRecordArray) {
      this._findAllRecordArray.pushObject(record);
    }
    if (this.recordArrays) {
      this.recordArrays.forEach(function(recordArray) {
        if (recordArray instanceof Ember.FilteredRecordArray) {
          recordArray.registerObserversOnRecord(record);
          recordArray.updateFilter();
        } else {
          recordArray.pushObject(record);
        }
      });
    }
  },

  removeFromRecordArrays: function(record) {
    if (this._findAllRecordArray) {
      this._findAllRecordArray.removeObject(record);
    }
    if (this.recordArrays) {
      this.recordArrays.forEach(function(recordArray) {
        recordArray.removeObject(record);
      });
    }
  },

  // FIXME
  findFromCacheOrLoad: function(data) {
    var record = this.cachedRecordForId(data.id);
    // set(record, 'data', data);
    record.load(data.id, data);
    return record;
  },

  registerRecordArray: function(recordArray) {
    if (!this.recordArrays) { this.recordArrays = []; }
    this.recordArrays.push(recordArray);
  },

  unregisterRecordArray: function(recordArray) {
    if (!this.recordArrays) { return; }
    Ember.A(this.recordArrays).removeObject(recordArray);
  },

  forEachCachedRecord: function(callback) {
    if (!this.recordCache) { return Ember.A([]); }
    var ids = Object.keys(this.recordCache);
    ids.map(function(id) {
      return this.recordCache[parseInt(id, 10)];
    }, this).forEach(callback);
  },

  load: function(hashes) {
    if (!this.sideloadedData) { this.sideloadedData = {}; }
    for (var i = 0, l = hashes.length; i < l; i++) {
      var hash = hashes[i];
      this.sideloadedData[hash.id] = hash; // FIXME: hardcoding `id` property
    }
  }
});