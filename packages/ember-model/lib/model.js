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

function isDescriptor(value) {
  // Ember < 1.11
  if (Ember.Descriptor !== undefined) {
    return value instanceof Ember.Descriptor;
  }
  // Ember >= 1.11
  return value && typeof value === 'object' && value.isDescriptor;
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

  isDirty: function() {
    var dirtyAttributes = get(this, '_dirtyAttributes');
    return dirtyAttributes && dirtyAttributes.length !== 0 || false;
  }.property('_dirtyAttributes.length'),

  _relationshipBecameDirty: function(name) {
    var dirtyAttributes = get(this, '_dirtyAttributes');
    if (dirtyAttributes) {
        dirtyAttributes.addObject(name);
    } else {
        set(this, '_dirtyAttributes', [name]);
    }
  },

  _relationshipBecameClean: function(name) {
    var dirtyAttributes = get(this, '_dirtyAttributes');
    if (dirtyAttributes) { dirtyAttributes.removeObject(name); }
  },

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
    if (!this._dirtyAttributes) {
      set(this, '_dirtyAttributes', []);
    }
    this._super();
  },

  _createReference: function() {
    var reference = this._reference,
        id = this.getPrimaryKey();

    if (!reference) {
      reference = this.constructor._getOrCreateReferenceForId(id);
      set(reference, 'record', this);
      this._reference = reference;
    } else if (reference.id !== id) {
      reference.id = id;
      this.constructor._cacheReference(reference);
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
    this.getWithDefault('_dirtyAttributes', []).clear();

    this._reloadHasManys();

    // eagerly load embedded data
    var relationships = this.constructor._relationships || [], meta = Ember.meta(this), relationshipKey, relationship, relationshipMeta, relationshipData, relationshipType;
    for (var i = 0, l = relationships.length; i < l; i++) {
      relationshipKey = relationships[i];
      relationship = (meta.descs || this)[relationshipKey];
      relationshipMeta = relationship.meta();

      if (relationshipMeta.options.embedded) {
        relationshipType = relationshipMeta.type;
        if (typeof relationshipType === "string") {
          relationshipType = Ember.get(Ember.lookup, relationshipType) || this.container.lookupFactory('model:'+ relationshipType);
        }

        relationshipData = data[relationshipKey];
        if (relationshipData) {
          relationshipType.load(relationshipData);
        }
      }
    }

    set(this, 'isNew', false);
    set(this, 'isLoaded', true);
    this._createReference();
    this.trigger('didLoad');
  },

  didDefineProperty: function(proto, key, value) {
    if (isDescriptor(value)) {
      var meta = value.meta();
      var klass = proto.constructor;

      if (meta.isAttribute) {
        if (!klass._attributes) { klass._attributes = []; }
        klass._attributes.push(key);
      } else if (meta.isRelationship) {
        if (!klass._relationships) { klass._relationships = []; }
        klass._relationships.push(key);
        meta.relationshipKey = key;
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
      var primaryKey = get(meta.getType(this), 'primaryKey');
      return this.get(key + '.' + primaryKey);
    }
  },

  toJSON: function() {
    var key, meta,
        json = {},
        attributes = this.constructor.getAttributes(),
        relationships = this.constructor.getRelationships(),
        properties = attributes ? this.getProperties(attributes) : {},
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

    if (relationships) {
      var data, relationshipKey;

      for(var i = 0; i < relationships.length; i++) {
        key = relationships[i];
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
    this.getWithDefault('_dirtyAttributes', []).clear();
    return this.constructor.reload(this.get(get(this.constructor, 'primaryKey')), this.container);
  },

  revert: function() {
    this.getWithDefault('_dirtyAttributes', []).clear();
    this.notifyPropertyChange('_data');
    this._reloadHasManys(true);
  },

  didCreateRecord: function() {
    var primaryKey = get(this.constructor, 'primaryKey'),
        id = get(this, primaryKey);

    set(this, 'isNew', false);

    set(this, '_dirtyAttributes', []);
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
    set(this, '_dirtyAttributes', []);
    this._resetDirtyStateInNestedObjects(this); // we need to reset isDirty state to all child objects in embedded relationships
  },

  _resetDirtyStateInNestedObjects: function(object) {
    var i, obj;
    if (object._hasManyArrays) {
      for (i = 0; i < object._hasManyArrays.length; i++) {
        var array = object._hasManyArrays[i];
        array.revert();
        if (array.embedded) {
          for (var j = 0; j < array.get('length'); j++) {
            obj = array.objectAt(j);
            obj._copyDirtyAttributesToData();
          }
        }
      }
    }

    if (object._belongsTo) {
      for (i = 0; i < object._belongsTo.length; i++) {
        var belongsTo = object._belongsTo[i];
        if (belongsTo.options.embedded) {
          obj = this.get(belongsTo.relationshipKey);
          if (obj) {
            obj._copyDirtyAttributesToData();
          }
        }
      }
    }
  },

  _registerHasManyArray: function(array) {
    if (!this._hasManyArrays) { this._hasManyArrays = Ember.A([]); }

    this._hasManyArrays.pushObject(array);
  },

  registerParentHasManyArray: function(array) {
    if (!this._parentHasManyArrays) { this._parentHasManyArrays = Ember.A([]); }

    this._parentHasManyArrays.pushObject(array);
  },

  unregisterParentHasManyArray: function(array) {
    if (!this._parentHasManyArrays) { return; }

    this._parentHasManyArrays.removeObject(array);
  },

  _reloadHasManys: function(reverting) {
    if (!this._hasManyArrays) { return; }
    var i, j;
    for (i = 0; i < this._hasManyArrays.length; i++) {
      var array = this._hasManyArrays[i],
          hasManyContent = this._getHasManyContent(get(array, 'key'), get(array, 'modelClass'), get(array, 'embedded'));
      if (!reverting) {
        for (j = 0; j < array.get('length'); j++) {
          if (array.objectAt(j).get('isNew') && !array.objectAt(j).get('isDeleted')) {
            hasManyContent.addObject(array.objectAt(j)._reference);
          }
        }
      }
      array.load(hasManyContent);
    }
  },

  _getHasManyContent: function(key, type, embedded) {
    var content = get(this, '_data.' + key);

    if (content) {
      var mapFunction, primaryKey, reference;
      if (embedded) {
        primaryKey = get(type, 'primaryKey');
        mapFunction = function(attrs) {
          reference = type._getOrCreateReferenceForId(attrs[primaryKey]);
          reference.data = attrs;
          return reference;
        };
      } else {
        mapFunction = function(id) { return type._getOrCreateReferenceForId(id); };
      }
      content = content.map(mapFunction);
    }

    return Ember.A(content || []);
  },

  _registerBelongsTo: function(key) {
    if (!this._belongsTo) { this._belongsTo = Ember.A([]); }

    this._belongsTo.pushObject(key);
  }
});

Ember.Model.reopenClass({
  primaryKey: 'id',

  adapter: Ember.Adapter.create(),

  _clientIdCounter: 1,

  getAttributes: function() {
    this.proto(); // force class "compilation" if it hasn't been done.
    var attributes = this._attributes || [];
    if (typeof this.superclass.getAttributes === 'function') {
      attributes = this.superclass.getAttributes().concat(attributes);
    }
    return attributes;
  },

  getRelationships: function() {
    this.proto(); // force class "compilation" if it hasn't been done.
    var relationships = this._relationships || [];
    if (typeof this.superclass.getRelationships === 'function') {
      relationships = this.superclass.getRelationships().concat(relationships);
    }
    return relationships;
  },

  fetch: function(id) {
    if (!arguments.length) {
      return this._findFetchAll(true);
    } else if (Ember.isArray(id)) {
      return this._findFetchMany(id, true);
    } else if (typeof id === 'object') {
      return this._findFetchQuery(id, true);
    } else {
      return this._findFetchById(id, true);
    }
  },

  find: function(id) {
    if (!arguments.length) {
      return this._findFetchAll(false);
    } else if (Ember.isArray(id)) {
      return this._findFetchMany(id, false);
    } else if (typeof id === 'object') {
      return this._findFetchQuery(id, false);
    } else {
      return this._findFetchById(id, false);
    }
  },

  findQuery: function(params) {
    return this._findFetchQuery(params, false);
  },

  fetchQuery: function(params) {
    return this._findFetchQuery(params, true);
  },

  _findFetchQuery: function(params, isFetch, container) {
    var records = Ember.RecordArray.create({modelClass: this, _query: params, container: container});

    var promise = this.adapter.findQuery(this, records, params);

    return isFetch ? promise : records;
  },

  findMany: function(ids) {
    return this._findFetchMany(ids, false);
  },

  fetchMany: function(ids) {
    return this._findFetchMany(ids, true);
  },

  _findFetchMany: function(ids, isFetch, container) {
    Ember.assert("findFetchMany requires an array", Ember.isArray(ids));

    var records = Ember.RecordArray.create({_ids: ids, modelClass: this, container: container}),
        deferred;

    if (!this.recordArrays) { this.recordArrays = []; }
    this.recordArrays.push(records);

    if (this._currentBatchIds) {
      concatUnique(this._currentBatchIds, ids);
      this._currentBatchRecordArrays.push(records);
    } else {
      this._currentBatchIds = concatUnique([], ids);
      this._currentBatchRecordArrays = [records];
    }

    if (isFetch) {
      deferred = Ember.RSVP.defer();
      Ember.set(deferred, 'resolveWith', records);

      if (!this._currentBatchDeferreds) { this._currentBatchDeferreds = []; }
      this._currentBatchDeferreds.push(deferred);
    }

    Ember.run.scheduleOnce('data', this, this._executeBatch, container);

    return isFetch ? deferred.promise : records;
  },

  findAll: function() {
    return this._findFetchAll(false);
  },

  fetchAll: function() {
    return this._findFetchAll(true);
  },

  _findFetchAll: function(isFetch, container) {
    var self = this;

    var currentFetchPromise = this._currentFindFetchAllPromise;
    if (isFetch && currentFetchPromise) {
      return currentFetchPromise;
    } else if (this._findAllRecordArray) {
      if (isFetch) {
        return new Ember.RSVP.Promise(function(resolve) {
          resolve(self._findAllRecordArray);
        });
      } else {
        return this._findAllRecordArray;
      }
    }

    var records = this._findAllRecordArray = Ember.RecordArray.create({modelClass: this, container: container});

    var promise = this._currentFindFetchAllPromise = this.adapter.findAll(this, records);

    promise['finally'](function() {
      self._currentFindFetchAllPromise = null;
    });

    // Remove the cached record array if the promise is rejected
    if (promise.then) {
      promise.then(null, function() {
        self._findAllRecordArray = null;
        return Ember.RSVP.reject.apply(null, arguments);
      });
    }

    return isFetch ? promise : records;
  },

  findById: function(id) {
    return this._findFetchById(id, false);
  },

  fetchById: function(id) {
    return this._findFetchById(id, true);
  },

  _findFetchById: function(id, isFetch, container) {
    var record = this.cachedRecordForId(id, container),
        isLoaded = get(record, 'isLoaded'),
        adapter = get(this, 'adapter'),
        deferredOrPromise;

    if (isLoaded) {
      if (isFetch) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          resolve(record);
        });
      } else {
        return record;
      }
    }

    deferredOrPromise = this._fetchById(record, id);

    return isFetch ? deferredOrPromise : record;
  },

  _currentBatchIds: null,
  _currentBatchRecordArrays: null,
  _currentBatchDeferreds: null,

  reload: function(id, container) {
    var record = this.cachedRecordForId(id, container);
    record.set('isLoaded', false);
    return this._fetchById(record, id);
  },

  _fetchById: function(record, id) {
    var adapter = get(this, 'adapter'),
        deferred;

    if (adapter.findMany && !adapter.findMany.isUnimplemented) {
      if (this._currentBatchIds) {
        if (!contains(this._currentBatchIds, id)) { this._currentBatchIds.push(id); }
      } else {
        this._currentBatchIds = [id];
        this._currentBatchRecordArrays = [];
      }

      deferred = Ember.RSVP.defer();

      //Attached the record to the deferred so we can resolve it later.
      Ember.set(deferred, 'resolveWith', record);

      if (!this._currentBatchDeferreds) { this._currentBatchDeferreds = []; }
      this._currentBatchDeferreds.push(deferred);

      Ember.run.scheduleOnce('data', this, this._executeBatch, record.container);

      return deferred.promise;
    } else {
      return adapter.find(record, id);
    }
  },

  _executeBatch: function(container) {
    var batchIds = this._currentBatchIds,
        batchRecordArrays = this._currentBatchRecordArrays,
        batchDeferreds = this._currentBatchDeferreds,
        self = this,
        requestIds = [],
        promise,
        i;

    this._currentBatchIds = null;
    this._currentBatchRecordArrays = null;
    this._currentBatchDeferreds = null;

    for (i = 0; i < batchIds.length; i++) {
      if (!this.cachedRecordForId(batchIds[i]).get('isLoaded')) {
        requestIds.push(batchIds[i]);
      }
    }

    if (requestIds.length === 1) {
      promise = get(this, 'adapter').find(this.cachedRecordForId(requestIds[0], container), requestIds[0]);
    } else {
      var recordArray = Ember.RecordArray.create({_ids: batchIds, container: container});
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

      if (batchDeferreds) {
        for (i = 0, l = batchDeferreds.length; i < l; i++) {
          var resolveWith = Ember.get(batchDeferreds[i], 'resolveWith');
          batchDeferreds[i].resolve(resolveWith);
        }
      }
    }).then(null, function(errorXHR) {
      if (batchDeferreds) {
        for (var i = 0, l = batchDeferreds.length; i < l; i++) {
          batchDeferreds[i].reject(errorXHR);
        }
      }
    });
  },

  getCachedReferenceRecord: function(id, container){
    var ref = this._getReferenceById(id);
    if(ref && ref.record) {
      if (! ref.record.container) {
        ref.record.container = container;
      }
      return ref.record;
    }
    return undefined;
  },

  cachedRecordForId: function(id, container) {
    var record;
    if (!this.transient) {
      record = this.getCachedReferenceRecord(id, container);
    }

    if (!record) {
      var primaryKey = get(this, 'primaryKey'),
          attrs = {isLoaded: false};

      attrs[primaryKey] = id;
      attrs.container = container;
      record = this.create(attrs);
      if (!this.transient) {
        var sideloadedData = this.sideloadedData && this.sideloadedData[id];
        if (sideloadedData) {
          record.load(id, sideloadedData);
        }
      }
    }

    return record;
  },


  addToRecordArrays: function(record) {
    if (this._findAllRecordArray) {
      this._findAllRecordArray.addObject(record);
    }
    if (this.recordArrays) {
      this.recordArrays.forEach(function(recordArray) {
        if (recordArray instanceof Ember.FilteredRecordArray) {
          recordArray.registerObserversOnRecord(record);
          recordArray.updateFilter();
        } else {
          recordArray.addObject(record);
        }
      });
    }
  },

  unload: function (record) {
    this.removeFromHasManyArrays(record);
    this.removeFromRecordArrays(record);
    var primaryKey = record.get(get(this, 'primaryKey'));
    this.removeFromCache(primaryKey);
  },

  clearCache: function () {
    this.sideloadedData = undefined;
    this._referenceCache = undefined;
    this._findAllRecordArray = undefined;
  },

  removeFromCache: function (key) {
    if (this.sideloadedData && this.sideloadedData[key]) {
      delete this.sideloadedData[key];
    }
    if(this._referenceCache && this._referenceCache[key]) {
      delete this._referenceCache[key];
    }
  },

  removeFromHasManyArrays: function(record) {
    if (record._parentHasManyArrays) {
      record._parentHasManyArrays.forEach(function(hasManyArray) {
        hasManyArray.unloadObject(record);
      });
      record._parentHasManyArrays = null;
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
  findFromCacheOrLoad: function(data, container) {
    var record;
    if (!data[get(this, 'primaryKey')]) {
      record = this.create({isLoaded: false, container: container});
    } else {
      record = this.cachedRecordForId(data[get(this, 'primaryKey')], container);
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
    if (!this._referenceCache) { return; }
    var ids = Object.keys(this._referenceCache);
    ids.map(function(id) {
      return this._getReferenceById(id).record;
    }, this).forEach(callback);
  },

  load: function(hashes, container) {
    if (Ember.typeOf(hashes) !== 'array') { hashes = [hashes]; }

    if (!this.sideloadedData) { this.sideloadedData = {}; }

    for (var i = 0, l = hashes.length; i < l; i++) {
      var hash = hashes[i],
          primaryKey = hash[get(this, 'primaryKey')],
          record = this.getCachedReferenceRecord(primaryKey, container);

      if (record) {
        record.load(primaryKey, hash);
      } else {
        this.sideloadedData[primaryKey] = hash;
      }
    }
  },

  _getReferenceById: function(id) {
    if (!this._referenceCache) { this._referenceCache = {}; }
    return this._referenceCache[id];
  },

  _getOrCreateReferenceForId: function(id) {
    var reference = this._getReferenceById(id);

    if (!reference) {
      reference = this._createReference(id);
    }

    return reference;
  },

  _createReference: function(id) {
    if (!this._referenceCache) { this._referenceCache = {}; }

    Ember.assert('The id ' + id + ' has already been used with another record of type ' + this.toString() + '.', !id || !this._referenceCache[id]);

    var reference = {
      id: id,
      clientId: this._clientIdCounter++
    };

    this._cacheReference(reference);

    return reference;
  },

  _cacheReference: function(reference) {
    if (!this._referenceCache) { this._referenceCache = {}; }

    // if we're creating an item, this process will be done
    // later, once the object has been persisted.
    if (!Ember.isEmpty(reference.id)) {
      this._referenceCache[reference.id] = reference;
    }
  }
});
