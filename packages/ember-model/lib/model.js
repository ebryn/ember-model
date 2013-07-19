require('ember-model/adapter');
require('ember-model/record_array');

var get = Ember.get,
    set = Ember.set,
    setProperties = Ember.setProperties,
    meta = Ember.meta,
    underscore = Ember.String.underscore;

function contains(array, element) {
  for (var i = 0, l = array.length; i < l; i++) {
    if (array[i] === element) { return true; }
  }
  return false;
}

function concatUnique(toArray, fromArray) {
  var e;
  for (var i = 0, l = fromArray.length; i < l; i++) {
    e = fromArray[i];
    if (!contains(toArray, e)) { toArray.push(e); }
  }
  return toArray;
}

function hasCachedValue(object, key) {
  var objectMeta = meta(object, false);
  if (objectMeta) {
    return key in objectMeta.cache;
  }
}

function extractDirty(object, attrsOrRelations, dirtyAttributes) {
  var key, desc, descMeta, type, dataValue, cachedValue, isDirty, dataType;
  for (var i = 0, l = attrsOrRelations.length; i < l; i++) {
    key = attrsOrRelations[i];
    if (!hasCachedValue(object, key)) { continue; }
    cachedValue = object.cacheFor(key);
    dataValue = get(object, '_data.' + object.dataKey(key));
    desc = meta(object).descs[key];
    descMeta = desc && desc.meta();
    type = descMeta.type;
    dataType = Ember.Model.dataTypes[type];

    if (type && type.isEqual) {
      isDirty = !type.isEqual(dataValue, cachedValue);
    } else if (dataType && dataType.isEqual) {
      isDirty = !dataType.isEqual(dataValue, cachedValue);
    } else if (dataValue && cachedValue instanceof Ember.Model) { // belongsTo case
      isDirty = get(cachedValue, 'isDirty');
    } else if (dataValue !== cachedValue) {
      isDirty = true;
    } else {
      isDirty = false;
    }

    if (isDirty) {
      dirtyAttributes.push(key);
    }
  }
}

Ember.run.queues.push('data');

Ember.Model = Ember.Object.extend(Ember.Evented, {
  isLoaded: true,
  isLoading: Ember.computed.not('isLoaded'),
  isNew: true,
  isDeleted: false,
  _dirtyAttributes: null,

  /**
    Called when attribute is accessed.

    @method getAttr
    @param key {String} key which is being accessed
    @param value {Object} value, which will be returned from getter by default
  */
  getAttr: function(key, value) {
    return value;
  },

  isDirty: Ember.computed(function() {
    var attributes = this.attributes,
        relationships = this.relationships,
        dirtyAttributes = Ember.A(); // just for removeObject

    extractDirty(this, attributes, dirtyAttributes);
    if (relationships) {
      extractDirty(this, relationships, dirtyAttributes);
    }

    if (dirtyAttributes.length) {
      this._dirtyAttributes = dirtyAttributes;
      return true;
    } else {
      this._dirtyAttributes = [];
      return false;
    }
  }).property().volatile(),

  dataKey: function(key) {
    var camelizeKeys = get(this.constructor, 'camelizeKeys');
    var meta = this.constructor.metaForProperty(key);
    if (meta.options && meta.options.key) {
      return camelizeKeys ? underscore(meta.options.key) : meta.options.key;
    }
    return camelizeKeys ? underscore(key) : key;
  },

  init: function() {
    this._createReference();
    this._super();
  },

  _createReference: function() {
    var reference = this._reference,
        id = this.getPrimaryKey();

    if (!reference) {
      reference = this.constructor._referenceForId(id);
      reference.record = this;
      this._reference = reference;
    }

    if (!reference.id) {
      reference.id = id;
    }

    return reference;
  },

  getPrimaryKey: function() {
    return get(this, get(this.constructor, 'primaryKey'));
  },

  load: function(id, hash) {
    var data = {};
    data[get(this.constructor, 'primaryKey')] = id;
    set(this, '_data', Ember.merge(data, hash));
    set(this, 'isLoaded', true);
    set(this, 'isNew', false);
    this._createReference();
    this.trigger('didLoad');
  },

  didDefineProperty: function(proto, key, value) {
    if (value instanceof Ember.Descriptor) {
      var meta = value.meta();

      if (meta.isAttribute) {
        proto.attributes = proto.attributes ? proto.attributes.slice() : [];
        proto.attributes.push(key);
      } else if (meta.isRelationship) {
        proto.relationships = proto.relationships ? proto.relationships.slice() : [];
        proto.relationships.push(key);
      }
    }
  },

  serializeHasMany: function(key, meta) {
    return this.get(key).toJSON();
  },

  serializeBelongsTo: function(key, meta) {
    if (meta.options.embedded) {
      var record = this.get(key);
      return record ? record.toJSON() : null;
    } else {
      var primaryKey = get(meta.getType(), 'primaryKey');
      return this.get(key + '.' + primaryKey);
    }
  },

  toJSON: function() {
    var key, meta,
        json = {},
        properties = this.attributes ? this.getProperties(this.attributes) : {},
        rootKey = get(this.constructor, 'rootKey');

    for (key in properties) {
      meta = this.constructor.metaForProperty(key);
      if (meta.type && meta.type.serialize) {
        json[this.dataKey(key)] = meta.type.serialize(properties[key]);
      } else if (meta.type && Ember.Model.dataTypes[meta.type]) {
        json[this.dataKey(key)] = Ember.Model.dataTypes[meta.type].serialize(properties[key]);
      } else {
        json[this.dataKey(key)] = properties[key];
      }
    }

    if (this.relationships) {
      var data, relationshipKey;

      for(var i = 0; i < this.relationships.length; i++) {
        key = this.relationships[i];
        meta = this.constructor.metaForProperty(key);
        relationshipKey = meta.options.key || key;

        if (meta.kind === 'belongsTo') {
          data = this.serializeBelongsTo(key, meta);
        } else {
          data = this.serializeHasMany(key, meta);
        }

        json[relationshipKey] = data;

      }
    }

    if (rootKey) {
      var jsonRoot = {};
      jsonRoot[rootKey] = json;
      return jsonRoot;
    } else {
      return json;
    }
  },

  save: function() {
    var adapter = this.constructor.adapter;
    set(this, 'isSaving', true);
    if (get(this, 'isNew')) {
      return adapter.createRecord(this);
    } else if (get(this, 'isDirty')) {
      return adapter.saveRecord(this);
    } else { // noop, return a resolved promise
      var self = this,
          promise = new Ember.RSVP.Promise(function(resolve, reject) {
            resolve(self);
          });
      set(this, 'isSaving', false);
      return promise;
    }
  },

  reload: function() {
    return this.constructor.reload(this.get(get(this.constructor, 'primaryKey')));
  },

  revert: function() {
    if (this.get('isDirty')) {
      var data = get(this, '_data') || {},
          reverts = {};
      for (var i = 0; i < this._dirtyAttributes.length; i++) {
        var attr = this._dirtyAttributes[i];
        reverts[attr] = data[attr];
      }
      setProperties(this, reverts);
    }
  },

  didCreateRecord: function() {
    var primaryKey = get(this.constructor, 'primaryKey'),
        id = get(this, primaryKey);

    set(this, 'isNew', false);

    if (!this.constructor.recordCache) this.constructor.recordCache = {};
    this.constructor.recordCache[id] = this;

    this._copyDirtyAttributesToData();
    this.constructor.addToRecordArrays(this);
    this.trigger('didCreateRecord');
    this.didSaveRecord();
  },

  didSaveRecord: function() {
    set(this, 'isSaving', false);
    this.trigger('didSaveRecord');
    if (this.get('isDirty')) { this._copyDirtyAttributesToData(); }
  },

  deleteRecord: function() {
    return this.constructor.adapter.deleteRecord(this);
  },

  didDeleteRecord: function() {
    this.constructor.removeFromRecordArrays(this);
    set(this, 'isDeleted', true);
    this.trigger('didDeleteRecord');
  },

  _copyDirtyAttributesToData: function() {
    if (!this._dirtyAttributes) { return; }
    var dirtyAttributes = this._dirtyAttributes,
        data = get(this, '_data'),
        key;

    if (!data) {
      data = {};
      set(this, '_data', data);
    }
    for (var i = 0, l = dirtyAttributes.length; i < l; i++) {
      // TODO: merge Object.create'd object into prototype
      key = dirtyAttributes[i];
      data[this.dataKey(key)] = this.cacheFor(key);
    }
    this._dirtyAttributes = [];
  },

  dataDidChange: Ember.observer(function() {
    this._reloadHasManys();
  }, '_data'),

  _registerHasManyArray: function(array) {
    if (!this._hasManyArrays) { this._hasManyArrays = Ember.A([]); }

    this._hasManyArrays.pushObject(array);
  },

  _reloadHasManys: function() {
    if (!this._hasManyArrays) { return; }

    var i;
    for(i = 0; i < this._hasManyArrays.length; i++) {
      var array = this._hasManyArrays[i];
      set(array, 'content', this._getHasManyContent(get(array, 'key'), get(array, 'modelClass'), get(array, 'embedded')));
    }
  },

  _getHasManyContent: function(key, type, embedded) {
    var content = get(this, '_data.' + key);

    if (content) {
      var mapFunction, primaryKey, reference;
      if (embedded) {
        primaryKey = get(type, 'primaryKey');
        mapFunction = function(attrs) {
          reference = type._referenceForId(attrs[primaryKey]);
          reference.data = attrs;
          return reference;
        };
      } else {
        mapFunction = function(id) { return type._referenceForId(id); };
      }
      content = Ember.EnumerableUtils.map(content, mapFunction);
    }

    return Ember.A(content || []);
  }
});

Ember.Model.reopenClass({
  primaryKey: 'id',

  adapter: Ember.Adapter.create(),

  _clientIdCounter: 1,

  fetch: function() {
    return Ember.loadPromise(this.find.apply(this, arguments));
  },

  find: function(id) {
    if (!arguments.length) {
      return this.findAll();
    } else if (Ember.isArray(id)) {
      return this.findMany(id);
    } else if (typeof id === 'object') {
      return this.findQuery(id);
    } else {
      return this.findById(id);
    }
  },

  findMany: function(ids) {
    Ember.assert("findMany requires an array", Ember.isArray(ids));

    var records = Ember.RecordArray.create({_ids: ids});

    if (!this.recordArrays) { this.recordArrays = []; }
    this.recordArrays.push(records);

    if (this._currentBatchIds) {
      concatUnique(this._currentBatchIds, ids);
      this._currentBatchRecordArrays.push(records);
    } else {
      this._currentBatchIds = concatUnique([], ids);
      this._currentBatchRecordArrays = [records];
    }

    Ember.run.scheduleOnce('data', this, this._executeBatch);

    return records;
  },

  findAll: function() {
    if (this._findAllRecordArray) { return this._findAllRecordArray; }

    var records = this._findAllRecordArray = Ember.RecordArray.create({modelClass: this});

    this.adapter.findAll(this, records);

    return records;
  },

  _currentBatchIds: null,
  _currentBatchRecordArrays: null,

  findById: function(id) {
    var record = this.cachedRecordForId(id);

    if (!get(record, 'isLoaded')) {
      this._fetchById(record, id);
    }
    return record;
  },

  reload: function(id) {
    var record = this.cachedRecordForId(id);

    this._fetchById(record, id);

    return record;
  },

  _fetchById: function(record, id) {
    var adapter = get(this, 'adapter');

    if (adapter.findMany && !adapter.findMany.isUnimplemented) {
      if (this._currentBatchIds) {
        if (!contains(this._currentBatchIds, id)) { this._currentBatchIds.push(id); }
      } else {
        this._currentBatchIds = [id];
        this._currentBatchRecordArrays = [];
      }

      Ember.run.scheduleOnce('data', this, this._executeBatch);
      // TODO: return a promise here
    } else {
      return adapter.find(record, id);
    }
  },

  _executeBatch: function() {
    var batchIds = this._currentBatchIds,
        batchRecordArrays = this._currentBatchRecordArrays,
        self = this,
        requestIds = [],
        promise,
        i;

    this._currentBatchIds = null;
    this._currentBatchRecordArrays = null;

    for (i = 0; i < batchIds.length; i++) {
      if (!this.cachedRecordForId(batchIds[i]).get('isLoaded')) {
        requestIds.push(batchIds[i]);
      }
    }

    if (batchIds.length === 1) {
      promise = get(this, 'adapter').find(this.cachedRecordForId(batchIds[0]), batchIds[0]);
    } else {
      var recordArray = Ember.RecordArray.create({_ids: batchIds});
      if (requestIds.length === 0) {
        promise = new Ember.RSVP.Promise(function(resolve, reject) { resolve(recordArray); });
        recordArray.notifyLoaded();
      } else {
        promise = get(this, 'adapter').findMany(this, recordArray, requestIds);
      }
    }

    promise.then(function() {
      for (var i = 0, l = batchRecordArrays.length; i < l; i++) {
        batchRecordArrays[i].loadForFindMany(self);
      }
    });
  },

  findQuery: function(params) {
    var records = Ember.RecordArray.create();

    this.adapter.findQuery(this, records, params);

    return records;
  },

  cachedRecordForId: function(id) {
    if (!this.recordCache) { this.recordCache = {}; }
    var record;

    if (this.recordCache[id]) {
      record = this.recordCache[id];
    } else {
      var primaryKey = get(this, 'primaryKey'),
          attrs = {isLoaded: false};
      attrs[primaryKey] = id;
      record = this.create(attrs);
      var sideloadedData = this.sideloadedData && this.sideloadedData[id];
      if (sideloadedData) {
        record.load(id, sideloadedData);
      }
      this.recordCache[id] = record;
    }

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
    var record;
    if (!data[get(this, 'primaryKey')]) {
      record = this.create({isLoaded: false});
    } else {
      record = this.cachedRecordForId(data[get(this, 'primaryKey')]);
    }
    // set(record, 'data', data);
    record.load(data[get(this, 'primaryKey')], data);
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
      return this.recordCache[id];
    }, this).forEach(callback);
  },

  load: function(hashes) {
    if (!this.sideloadedData) { this.sideloadedData = {}; }
    for (var i = 0, l = hashes.length; i < l; i++) {
      var hash = hashes[i];
      this.sideloadedData[hash[get(this, 'primaryKey')]] = hash;
    }
  },

  _referenceForId: function(id) {
    if (!this._idToReference) { this._idToReference = {}; }

    var reference = this._idToReference[id];
    if (!reference) {
      reference = this._createReference(id);
    }

    return reference;
  },

  _createReference: function(id) {
    if (!this._idToReference) { this._idToReference = {}; }

    Ember.assert('The id ' + id + ' has alread been used with another record of type ' + this.toString() + '.', !id || !this._idToReference[id]);

    var reference = {
      id: id,
      clientId: this._clientIdCounter++
    };

    // if we're creating an item, this process will be done
    // later, once the object has been persisted.
    if (id) {
      this._idToReference[id] = reference;
    }

    return reference;
  }
});
