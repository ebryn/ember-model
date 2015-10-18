(function() {

var VERSION = '0.0.16-yp';

if (Ember.libraries) {
  Ember.libraries.register('Ember Model', VERSION);
}


})();

(function() {

function mustImplement(message) {
  var fn = function() {
    var className = this.constructor.toString();

    throw new Error(message.replace('{{className}}', className));
  };
  fn.isUnimplemented = true;
  return fn;
}

Ember.Adapter = Ember.Object.extend({
  find: mustImplement('{{className}} must implement find'),
  findQuery: mustImplement('{{className}} must implement findQuery'),
  findMany: mustImplement('{{className}} must implement findMany'),
  findAll: mustImplement('{{className}} must implement findAll'),
  createRecord: mustImplement('{{className}} must implement createRecord'),
  saveRecord: mustImplement('{{className}} must implement saveRecord'),
  deleteRecord: mustImplement('{{className}} must implement deleteRecord'),

  load: function(record, id, data) {
    record.load(id, data);
  }
});


})();

(function() {

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
        key = (meta.options && meta.options.key) || keys[i];
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


})();

(function() {

var get = Ember.get;

Ember.loadPromise = function(target) {
  if (Ember.isNone(target)) {
    return null;
  } else if (target.then) {
    return target;
  } else {
    var deferred = Ember.RSVP.defer();

    if (get(target, 'isLoaded') && !get(target, 'isNew')) {
      deferred.resolve(target);
    } else {
      target.one('didLoad', this, function() {
        deferred.resolve(target);
      });
    }

    return deferred.promise;
  }
};


})();

(function() {

var get = Ember.get,
    set = Ember.set;

Ember.RecordArray = Ember.ArrayProxy.extend(Ember.Evented, {
  isLoaded: false,
  isLoading: Ember.computed.not('isLoaded'),

  load: function(klass, data, subgraph) {
    set(this, 'content', this.materializeData(klass, data, subgraph));
    this.notifyLoaded();
  },

  loadForFindMany: function(klass) {
    var self = this;
    var content = get(this, '_ids').map(function(id) { return klass.cachedRecordForId(id, self.container); });
    set(this, 'content', Ember.A(content));
    this.notifyLoaded();
  },

  notifyLoaded: function() {
    set(this, 'isLoaded', true);
    this.trigger('didLoad');
  },

  materializeData: function(klass, data, subgraph) {
    var self = this;
    return Ember.A(data.map(function(el) {
      return klass.findFromCacheOrLoad(el, subgraph, self.container); // FIXME
    }));
  },

  reload: function() {
    var modelClass = this.get('modelClass'),
        self = this,
        promises;
    
    set(this, 'isLoaded', false);
    if (this.setupPromise) { this.setupPromise(); }
    if (modelClass._findAllRecordArray === this) {
      return modelClass.adapter.findAll(modelClass, this);
    } else if (this._query) {
      return modelClass.adapter.findQuery(modelClass, this, this._query);
    } else {
      promises = this.map(function(record) {
        return record.reload();
      });
      return Ember.RSVP.all(promises).then(function(data) {
        self.notifyLoaded();
      });
    }
  }
});


})();

(function() {

var get = Ember.get;

Ember.FilteredRecordArray = Ember.RecordArray.extend({
  init: function() {
    if (!get(this, 'modelClass')) {
      throw new Error('FilteredRecordArrays must be created with a modelClass');
    }
    if (!get(this, 'filterFunction')) {
      throw new Error('FilteredRecordArrays must be created with a filterFunction');
    }
    if (!get(this, 'filterProperties')) {
      throw new Error('FilteredRecordArrays must be created with filterProperties');
    }

    var modelClass = get(this, 'modelClass');
    modelClass.registerRecordArray(this);

    this.registerObservers();
    this.updateFilter();

    this._super();
  },

  updateFilter: function() {
    var self = this,
        results = [];
    get(this, 'modelClass').forEachCachedRecord(function(record) {
      if (self.filterFunction(record)) {
        results.push(record);
      }
    });
    this.set('content', Ember.A(results));
  },

  updateFilterForRecord: function(record) {
    var results = get(this, 'content');
    if (this.filterFunction(record) && !results.contains(record)) {
      results.pushObject(record);
    }
  },

  registerObservers: function() {
    var self = this;
    get(this, 'modelClass').forEachCachedRecord(function(record) {
      self.registerObserversOnRecord(record);
    });
  },

  registerObserversOnRecord: function(record) {
    var self = this,
        filterProperties = get(this, 'filterProperties');

    for (var i = 0, l = get(filterProperties, 'length'); i < l; i++) {
      record.addObserver(filterProperties[i], self, 'updateFilterForRecord');
    }
  }
});

})();

(function() {

var get = Ember.get, set = Ember.set;

var getInverseKeyFor = function(obj, type, lookForType) {
  var relKeys = type.getRelationships();
  for (var i = 0, l = relKeys.length; i < l; i++) {
    var key = relKeys[i];
    var rel = type.metaForProperty(key);
    // TODO do we want to reverse hasMany's and belongsTo simulatiously?
    // TODO complain when we can't decide automatically?
    var childType = rel.getType(obj);
    if (childType === lookForType) return key;
  }
  return null;
};

var getInverseKindFor = function(obj, type, lookForKey) {
  var relKeys = type.getRelationships();
  for (var i = 0, l = relKeys.length; i < l; i++) {
    var key = relKeys[i];
    if (lookForKey !== key) continue;
    var rel = type.metaForProperty(key);
    return rel.kind;
  }
  return null;
};

Ember.ManyArray = Ember.RecordArray.extend({
  _records: null,
  originalContent: null,
  _modifiedRecords: null,
  subgraph: null,
  _shadows: null,
  considerChildrenInDirty: false,

  unloadObject: function(record) {
    var obj = get(this, 'content').findBy('clientId', record._reference.clientId);
    get(this, 'content').removeObject(obj);

    var originalObj = get(this, 'originalContent').findBy('clientId', record._reference.clientId);
    get(this, 'originalContent').removeObject(originalObj);
  },

  nonShadowedContent: function() {
    var shadows = get(this, '_shadows');
    var content = get(this, 'content');
    if (!shadows || shadows.length === 0) {
      return content;
    }
    return content.filter(function(o) { return shadows.indexOf(o) === -1; });
  }.property('content.[]', '_shadows.[]'),

  // YPBUG: this was not a property in ember-models.js on YP
  isChildrenDirty: function() {
    return this._modifiedRecords && this._modifiedRecords.length;
  }.property('_modifiedRecords.[]'),

  isDirty: function() {
    var originalContent = get(this, 'originalContent'),
        originalContentLength = get(originalContent, 'length'),
        content = get(this, 'nonShadowedContent'),
        contentLength = get(content, 'length');

    if (originalContentLength !== contentLength) { return true; }

    if (get(this, 'considerChildrenInDirty') && get(this, 'isChildrenDirty')) { return true; }

    var isDirty = false;

    for (var i = 0, l = contentLength; i < l; i++) {
      if (!originalContent.contains(content[i])) {
        isDirty = true;
        break;
      }
    }

    return isDirty;
  }.property('nonShadowedContent.[]', 'originalContent.[]', '_modifiedRecords.[]'),

  isModified: function() {
    // Alias for compatibility with YP
    return get(this,'isDirty');
  }.property('isDirty'),

  objectAtContent: function(idx) {
    var content = get(this, 'content');

    // GMM add array index guard
    if (!content.length || idx >= content.length) { return; }
    
    // need to add observer if it wasn't materialized before
    var observerNeeded = (content[idx].record) ? false : true;

    var record = this.materializeRecord(idx, this.container);
    if (observerNeeded) {
      var isDirtyRecord = record.get('isDirty'), isNewRecord = record.get('isNew');
      if (isDirtyRecord || isNewRecord) { this._modifiedRecords.pushObject(content[idx]); }

      Ember.addObserver(content[idx], 'record.isDirty', this, 'recordStateChanged');
      record.registerParentHasManyArray(this);
    }

    return record;
  },

  save: function() {
    // TODO: loop over dirty records only
    return Ember.RSVP.all(this.map(function(record) {
      return record.save();
    }));
  },

  ensureReverseRelationship: function(record) {
    var inverseKey = get(this, 'inverse');
    if (inverseKey === undefined) {
      inverseKey = getInverseKeyFor(record, record.constructor, this.parent.constructor);
    }
    if (inverseKey == null) {
      return;
    }
    var inverseKind = getInverseKindFor(record, record.constructor, inverseKey);
    if (inverseKind !== 'belongsTo') {
      // TODO warn? hard to tell if it's actually a problem...
      return;
    }
    var inverseValue = record.get(inverseKey);
    if (inverseValue) {
      return;
    }
    record.set(inverseKey, this.parent);
  },

  replaceContent: function(index, removed, added, disableReverseCheck) {
    var addedRefs = Ember.EnumerableUtils.map(added, function(record) {
      return record._reference;
    }, this);

    // Don't allow dupes (particularly common because of shadowing)
    var existing = get(this, 'content');
    if (existing) {
      addedRefs = addedRefs.filter(function(item) {
        var found = existing.indexOf(item);
        // either it doesn't exist or it's in the range that's about to be removed
        return found === -1 || (found >= index && found <= index + removed);
      });
    }

    // we add the shadow back if it's a shadow'ing add
    var shadows = get(this, '_shadows');
    if (shadows) {
      shadows.removeObjects(addedRefs);
    }

    this._super(index, removed, addedRefs);

    // check if we need to set the inverse
    if (disableReverseCheck !== true) {
      Ember.EnumerableUtils.map(added, function(record) {
        if (record.get('isNew')) {
          this.ensureReverseRelationship(record);
        }
      }, this);
    }

    return addedRefs.length;
  },

  _contentDidChange: function() {
    var content = get(this, 'content');
    var contentPrev = this._content;

    if (contentPrev && contentPrev !== content) {
      this.arrayWillChange(contentPrev, 0, get(contentPrev, 'length'), 0);
      contentPrev.removeArrayObserver(this);
      this._setupOriginalContent(content);
    }

    if (content) {
      content.addArrayObserver(this);
      this.arrayDidChange(content, 0, 0, get(content, 'length'));
    }

    this._content = content;
  }.observes('content'),

  pushShadowObject: function(item) {
    item.registerParentHasManyArray(this);
    if (!item._reference) {
      item._createReference();
    }
    var added = this.replaceContent(get(this, 'content.length'), 0, [item], true);
    if (added) {
      get(this, '_shadows').pushObject(item._reference);
      this.arrayDidChange(item._reference, 0, 0, 0);
    }
  },

  arrayWillChange: function(item, idx, removedCnt, addedCnt) {
    var content = item;
    for (var i = idx; i < idx+removedCnt; i++) {
      var currentItem = content[i];
      if (currentItem && currentItem.record) {
        this._modifiedRecords.removeObject(currentItem);
        currentItem.record.unregisterParentHasManyArray(this);
        Ember.removeObserver(currentItem, 'record.isDirty', this, 'recordStateChanged');
      }
    }
  },

  arrayDidChange: function(item, idx, removedCnt, addedCnt) {
    var parent = get(this, 'parent'), relationshipKey = get(this, 'relationshipKey'),
        isDirty = get(this, 'isDirty');

    var content = item;
    for (var i = idx; i < idx+addedCnt; i++) {
      var currentItem = content[i];
      if (currentItem && currentItem.record) { 
        var isDirtyRecord = currentItem.record.get('isDirty'), isNewRecord = currentItem.record.get('isNew'); // why newly created object is not dirty?
        if (isDirtyRecord || isNewRecord) { this._modifiedRecords.pushObject(currentItem); }
        Ember.addObserver(currentItem, 'record.isDirty', this, 'recordStateChanged');
        currentItem.record.registerParentHasManyArray(this);
      }
    }

    if (isDirty) {
      parent._relationshipBecameDirty(relationshipKey);
    } else {
      parent._relationshipBecameClean(relationshipKey);
    }
  },

  load: function(content) {
    Ember.setProperties(this, {
      content: content,
      originalContent: content.slice()
    });
    set(this, '_modifiedRecords', []);
    set(this, '_shadows', []);
  },

  revert: function() {
    this._setupOriginalContent();
    if (get(this, 'isDeleted') && !get(this, 'isDead')) {
      set(this, 'isDeleted', false);
    }
  },

  _setupOriginalContent: function(content) {
    content = content || get(this, 'content');
    if (content) {
      set(this, 'originalContent', content.slice());
    }
    set(this, '_modifiedRecords', []);
    set(this, '_shadows', []);
  },

  init: function() {
    this._super();
    this._setupOriginalContent();
    this._contentDidChange();
  },

  recordStateChanged: function(obj, keyName) {
    if(!get(this, 'considerChildrenInDirty')) {
      return;
    }

    var parent = get(this, 'parent'), relationshipKey = get(this, 'relationshipKey');    

    if (obj.record.get('isDirty')) {
      if (this._modifiedRecords.indexOf(obj) === -1) { this._modifiedRecords.pushObject(obj); }
      parent._relationshipBecameDirty(relationshipKey);
    } else {
      if (this._modifiedRecords.indexOf(obj) > -1) { this._modifiedRecords.removeObject(obj); }
      if (!this.get('isDirty')) {
        parent._relationshipBecameClean(relationshipKey); 
      }
    }
  }
});

Ember.HasManyArray = Ember.ManyArray.extend({
  materializeRecord: function(idx, container) {
    var klass = get(this, 'modelClass'),
        content = get(this, 'content'),
        subgraph = get(this, 'subgraph'),
        reference = content.objectAt(idx),
        record = reference.record;

    if (record) {
      if (! record.container) {
        record.container = container;
      }

      if(Ember.isEmpty(reference.id)) {
        return record;
      }
    }

    return klass._findFetchById(reference.id, subgraph, false, container);
  },

  toJSON: function() {
    var ids = [], content = this.get('content');

    content.forEach(function(reference) {
      if (reference.id) {
        ids.push(reference.id);
      }
    });

    return ids;
  }
});

Ember.EmbeddedHasManyArray = Ember.ManyArray.extend({
  considerChildrenInDirty: true,

  create: function(attrs) {
    var klass = get(this, 'modelClass'),
        record = klass.create(attrs);

    this.pushObject(record);

    return record; // FIXME: inject parent's id
  },

  materializeRecord: function(idx, container) {
    var klass = get(this, 'modelClass'),
        primaryKey = get(klass, 'primaryKey'),
        content = get(this, 'content'),
        reference = content.objectAt(idx),
        attrs = reference.data;

    var record;
    if (reference.record) {
      record = reference.record;
    } else {
      record = klass.create({ _reference: reference, container: container });
      reference.record = record;
      if (attrs) {
        record.load(attrs[primaryKey], attrs);
      }
    }

    record.container = container;
    return record;
  },

  toJSON: function() {
    return this.map(function(record) {
      return record.toJSON();
    });
  }
});


})();

(function() {

var get = Ember.get,
    set = Ember.set,
    setProperties = Ember.setProperties,
    meta = Ember.meta,
    isNone = Ember.isNone,
    cacheFor = Ember.cacheFor,
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

function graphDiff(a, b) {
  var res = {};
  var aKeys = Object.keys(a);
  for(var i = 0, l = aKeys.length; i < l; i++) {
    if(!b.hasOwnProperty(aKeys[i])) {
      res[aKeys[i]] = 1;
    }
  }
  return res;
}

function graphUnion(a, b) {
  var res = {};
  Ember.merge(res, a);
  Ember.merge(res, b);
  return res;
}

Ember.run.queues.push('data');

Ember.Model = Ember.Object.extend(Ember.Evented, {
  isLoaded: true,
  isLoading: Ember.computed.not('isLoaded'),
  isNew: true,
  isDeleted: false, // <- in memory delete
  isDead: false, // <- server has responded that it's deleted
  _dirtyAttributes: null,
  _shadow: null,
  _graph: null,

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

  isModified: function() {
    // Alias for compatibility with YP
    return get(this, 'isDirty');
  }.property('isDirty'),

  isSub: function() {
    var graph = get(this, '_graph');
    return !isNone(graph);
  }.property('_graph'),

  graph: function() {
    return get(this, '_graph') || this.constructor.getGraph();
  }.property('_graph'),

  deferredGraph: function() {
    var graph = get(this, '_graph');
    if(isNone(graph)) {
      return {};
    }
    return graphDiff(this.constructor.getGraph(), graph);
  }.property('_graph'),

  _relationshipBecameDirty: function(name) {
    var dirtyAttributes = get(this, '_dirtyAttributes');
    if (!dirtyAttributes.contains(name)) { dirtyAttributes.pushObject(name); }
  },

  _relationshipBecameClean: function(name) {
    var dirtyAttributes = get(this, '_dirtyAttributes');
    dirtyAttributes.removeObject(name);
  },

  dataKey: function(key) {
    var camelizeKeys = get(this.constructor, 'camelizeKeys');
    var meta = this.constructor.metaForProperty(key);
    if (meta.options && meta.options.key) {
      return camelizeKeys ? underscore(meta.options.key) : meta.options.key;
    }
    return camelizeKeys ? underscore(key) : key;
  },

  isDeferredKey: function(key) {
    return get(this, 'isSub') && !get(this, 'graph')[key];
  },

  _reloadAndGet: function(key) {
    // TODO: reload just the deferred attributes.
    this.reload();
    return Ember.loadPromise(this).then(function(obj){
      return get(obj, key);
    });
  },

  init: function() {
    if (!this._shadow) {
      set(this, '_shadow', Ember.Object.create());
    }

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
    // YPBUG: wtf is this? 
    if (id == null) {
      // Apparently it is to "avoid error message when doing find()"
      // Thought is doesn't really matter as the find cache gets replaced if you call find()
      this.constructor.addToRecordArrays(this);
    }

    return reference;
  },

  getStore: function() {
    if (this.container) {
      return this.container.lookup('store:main');
    }

    return null;
  },

  getPrimaryKey: function() {
    return get(this, get(this.constructor, 'primaryKey'));
  },

  getRelationship: function(propertyKey, subgraph) {
    // This will override/set the computed property cache for a relationship and allow
    // for submodel get()'s
    var store = this.getStore(), 
        meta = this.constructor.metaForProperty(propertyKey),
        key = meta.options.key || propertyKey,
        type,
        record,
        collection;
    Ember.assert("Argument `subgraph` is required", !isNone(subgraph));
    Ember.assert("Not a relationship attribute", meta.isRelationship);
    Ember.assert("Relationship kind not recognized: " + meta.kind, 
      (meta.kind === 'belongsTo' || meta.kind === 'hasMany'));

    type = meta.getType(this);

    subgraph[get(type, 'primaryKey')] = 1;


    if(meta.options.embedded) {
      // TODO: handle submodel embedded relationships. For now just return this.get()
      return this.get(propertyKey);
    }

    if(meta.kind === 'belongsTo') {
      record = this.getBelongsTo(key, type, meta, store, subgraph);
      if(record !== cacheFor(this, propertyKey)) {
        this.set(propertyKey, record);
      }
      return record;
    } else {
      // is `hasMany` relationship kind.
      collection = this.get(propertyKey);
      collection.set('subgraph', subgraph);
      return collection;
    }
  },

  load: function(id, hash, subgraph) {
    var data = {};
    if(subgraph) {
      if(!get(this, 'isNew')) {
        data = get(this, '_data') || data;
        set(this, '_graph', graphUnion(get(this, 'graph'), subgraph));
      } else {
        set(this, '_graph', subgraph);
      }

      if(Object.keys(get(this, 'deferredGraph')).length === 0) {
        set(this, '_graph', null);
      }
    }

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
    if (value && typeof value === 'object' && isDescriptor(value)) {
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

  isLoadedForGraph: function(graph) {
    return (this.get('isLoaded') && (
          (!graph && !this.get('isSub')) || 
          (graph && Object.keys(graphDiff(graph, this.get('graph'))).length === 0))
        );
  },

  serializeHasMany: function(key, meta) {
    var cached = this.cacheFor(key);
    if (cached) {
      return cached.toJSON();
    }
    // YPBUG: we weren't using meta.options.key before.
    return this.get('_data.' + ((meta.options && meta.options.key) || key) || []);
  },

  serializeBelongsTo: function(key, meta) {
    if (meta.options.embedded) {
      var record = this.get(key);
      return record ? record.toJSON() : null;
    } else {
      var primaryKey = get(meta.getType(this), 'primaryKey');
      var cached = this.cacheFor(key);
      // GMM if you do set('assignedTo', null) for example we need to send the null to the server
      // note if there was no cache it would be undefined hense the triple equals
      if (cached === null) {
        return null;
      }
      if (cached) {
        return cached.get(primaryKey);
      }
      if(this.constructor.useBelongsToImplicitKey) {
        return this.get('_data.' + key + '_id');
      }
      var implicitId = this.get('_data.' + key + '_id');
      if(typeof implicitId !== 'undefined') {
        return implicitId;
      }
      return this.get(key + '.' + primaryKey);
    }
  },

  _availablePaths: function(paths) {
    if(!get(this, 'isSub')) {
      return paths;
    }

    var res = [], 
        graph = get(this, 'graph');

    for(var i = 0, l = paths.length; i < l; i++) {
      if(graph.hasOwnProperty(paths[i])) {
        res.push(paths[i]);
      }
    }
    return res;
  },

  toJSON: function() {
    var key, meta, value,
        json = {},
        attributes = this._availablePaths(this.constructor.getAttributes()),
        relationships = this._availablePaths(this.constructor.getRelationships()),
        properties = attributes ? this.getProperties(attributes) : {},
        rootKey = get(this.constructor, 'rootKey');

    for (key in properties) {
      meta = this.constructor.metaForProperty(key);
      value = properties[key];
      if(value === undefined) {
        value = null;
      }
      if (meta.type && meta.type.serialize) {
        json[this.dataKey(key)] = meta.type.serialize(value);
      } else if (meta.type && Ember.Model.dataTypes[meta.type]) {
        json[this.dataKey(key)] = Ember.Model.dataTypes[meta.type].serialize(value);
      } else {
        json[this.dataKey(key)] = value;
      }
    }

    if (relationships) {
      var data, relationshipKey;

      for(var i = 0; i < relationships.length; i++) {
        key = relationships[i];
        meta = this.constructor.metaForProperty(key);
        relationshipKey = meta.options.key || key;

        if (meta.kind === 'belongsTo') {
          if(this.constructor.useBelongsToImplicitKey) {
            // TODO(hliu): we should do this inside of the belongsTo() computed property
            // based on `useBelongsToImplicitKey`
            relationshipKey += '_id';
          }
          
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
    var self = this;
    Ember.assert("Cannot save subrecords.", !get(this, 'isSub'));
    set(this, 'isSaving', true);
    if (get(this, 'isDeleted')) {
      // GMM don't do anything when the record hasn't been saved
      if (!get(this, 'isNew')) {
        return this.constructor.adapter.deleteRecord(this);
      } else {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          Ember.run.later(this, function() {
            self.didDeleteRecord();
            resolve(self);
          }, 0);
        });
      }
    } else if (get(this, 'isNew')) {
      return adapter.createRecord(this);
    } else if (get(this, 'isDirty')) {
      return adapter.saveRecord(this);
    } else { // noop, return a resolved promise
      var promise = new Ember.RSVP.Promise(function(resolve, reject) {
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

    // THE FOLLOWING COMMENT IS OLD AND NO LONGER APPLIES ========================
    // GMM moved to createRecord for backwards compat with old ember-data
    // in theory I think it's actually better for it to work the original
    // this.constructor.addToRecordArrays(this);
    // ===========================================================================


    // YPBUG: ^^^ hliu this creates test failures throughout. Also the previous comment
    // is no longer accurate because we only .addToRecordArrays() inside of _createReference() 
    // when the record has no id. We can safely addToRecordArrays() here because I added
    // a no-dupe check.
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
    // This method only deletes a record in memory.
    var record = this;
    this.constructor.removeFromHasManyArrays(this);
    this.constructor.removeFromRecordArrays(this);
    set(this, 'isDeleted', true);
    // To fully delete a record, we now call deleteRecord() followed by a save()
    // so this next line isn't needed anymore:
    // return this.constructor.adapter.deleteRecord(this);
  },

  didDeleteRecord: function() {
    this.constructor.removeFromRecordArrays(this);
    set(this, 'isSaving', false);
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

      if(!reverting) {
        set(array, 'subgraph', null);
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
      content = Ember.EnumerableUtils.map(content, mapFunction);
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

  // YP: automatically add `_id` to the key for belongsTo?
  useBelongsToImplicitKey: true, 

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

  getGraph: function() {
    var attributes, relationships, i;
    if(!this._graph) {
      this._graph = {};
      attributes = this.getAttributes();
      relationships = this.getRelationships();

      for(i = 0; i < attributes.length; i++) {
        this._graph[attributes[i]] = 1;
      }

      for(i = 0; i < relationships.length; i++) {
        this._graph[relationships[i]] = 1;
      }

      this._graph[get(this, 'primaryKey')] = 1;
    }
    return this._graph;
  },

  _validateSubgraph: function(subgraph) {
    if(subgraph) {
      subgraph[get(this, 'primaryKey')] = 1;
      this._assertIsValidSubgraph(subgraph);
    }
  },

  fetch: function(id, subgraph) {
    if (isNone(id)) {
      return this._findFetchAll(subgraph, true);
    } else if (Ember.isArray(id)) {
      return this._findFetchMany(id, subgraph, true);
    } else if (typeof id === 'object') {
      return this._findFetchQuery(id, subgraph, true);
    } else {
      return this._findFetchById(id, subgraph, true);
    }
  },

  find: function(id, subgraph) {
    if (isNone(id)) {
      return this._findFetchAll(subgraph, false);
    } else if (Ember.isArray(id)) {
      return this._findFetchMany(id, subgraph, false);
    } else if (typeof id === 'object') {
      return this._findFetchQuery(id, subgraph, false);
    } else {
      return this._findFetchById(id, subgraph, false);
    }
  },

  findQuery: function(params, subgraph) {
    return this._findFetchQuery(params, subgraph, false);
  },

  fetchQuery: function(params, subgraph) {
    return this._findFetchQuery(params, subgraph, true);
  },

  _findFetchQuery: function(params, subgraph, isFetch, container) {
    this._validateSubgraph(subgraph);
    var records = Ember.RecordArray.create({modelClass: this, _query: params, _subgraph: subgraph, container: container});

    var promise = this.adapter.findQuery(this, records, params, subgraph);

    return isFetch ? promise : records;
  },

  findMany: function(ids, subgraph) {
    return this._findFetchMany(ids, subgraph, false);
  },

  fetchMany: function(ids, subgraph) {
    return this._findFetchMany(ids, subgraph, true);
  },

  _findFetchMany: function(ids, subgraph, isFetch, container) {
    Ember.assert("findFetchMany requires an array", Ember.isArray(ids));
    this._validateSubgraph(subgraph);

    var records = Ember.RecordArray.create({_ids: ids, modelClass: this, container: container, _subgraph: subgraph}),
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

    this._updateCurrentBatchSubgraph(subgraph);

    if (isFetch) {
      deferred = Ember.RSVP.defer();
      Ember.set(deferred, 'resolveWith', records);

      if (!this._currentBatchDeferreds) { this._currentBatchDeferreds = []; }
      this._currentBatchDeferreds.push(deferred);
    }

    Ember.run.scheduleOnce('data', this, this._executeBatch, container);

    return isFetch ? deferred.promise : records;
  },

  findAll: function(subgraph) {
    return this._findFetchAll(subgraph, false);
  },

  fetchAll: function(subgraph) {
    return this._findFetchAll(subgraph, true);
  },

  _findFetchAll: function(subgraph, isFetch, container) {
    this._validateSubgraph(subgraph);

    var self = this;

    var currentFetchPromise = this._currentFindFetchAllPromise;
    if (isFetch && currentFetchPromise) {
      return currentFetchPromise;
    } else if (this._findAllRecordArray) {
      this._findAllRecordArray.reload();
      if (isFetch) {
        return new Ember.RSVP.Promise(function(resolve) {
          resolve(self._findAllRecordArray);
        });
      } else {
        return this._findAllRecordArray;
      }
    }

    var records = this._findAllRecordArray = Ember.RecordArray.create({modelClass: this, container: container});

    var promise = this._currentFindFetchAllPromise = this.adapter.findAll(this, records, subgraph);

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

  findById: function(id, subgraph) {
    return this._findFetchById(id, subgraph, false);
  },

  fetchById: function(id, subgraph) {
    return this._findFetchById(id, subgraph, true);
  },

  _findFetchById: function(id, subgraph, isFetch, container) {
    var record = this.cachedRecordForId(id, container),
        isLoaded = get(record, 'isLoaded'),
        isNew = get(record, 'isNew'),
        adapter = get(this, 'adapter'),
        diffGraph,
        fullFetch,
        deferredOrPromise;

    // TODO: what if diffGraph is empty? 
    this._validateSubgraph(subgraph);

    if(subgraph) {
      
      if(!isNew) {
        diffGraph = graphDiff(subgraph, get(record, 'graph'));
      } else {
        diffGraph = subgraph;
      }
      
    } else {
      diffGraph = get(record, 'deferredGraph');
      // If record wasn't a subrecord already, we can just do a full
      // fetch when a `subgraph` isn't required.
      fullFetch = !get(record, 'isSub');
    }
    
    if (isLoaded && Object.keys(diffGraph).length === 0) {
      // If diffGraph is an empty object, it means the requested
      // `subgraph` is a subgraph of the record's loaded graph.
      if (isFetch) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          resolve(record);
        });
      } else {
        return record;
      }
    }

    if(diffGraph) {
      // Add the primary key to the diffGraph.
      diffGraph[get(this, 'primaryKey')] = 1;
    }

    record.set('isLoaded', false);
    deferredOrPromise = this._fetchById(record, id, (fullFetch ? undefined : diffGraph));

    return isFetch ? deferredOrPromise : record;
  },

  _currentBatchIds: null,
  _currentBatchRecordArrays: null,
  _currentBatchDeferreds: null,
  _currentBatchSubgraph: null,
  _FULL_GRAPH: '__full__',

  reload: function(id, container) {
    var record = this.cachedRecordForId(id, container);
    record.set('isLoaded', false);
    record.set('_graph', null);
    return this._fetchById(record, id);
  },

  _updateCurrentBatchSubgraph: function(subgraph) {
    if(isNone(subgraph)) {
      this._currentBatchSubgraph = this._FULL_GRAPH;
    } else if(this._currentBatchSubgraph !== this._FULL_GRAPH) {
      this._currentBatchSubgraph = graphUnion((this._currentBatchSubgraph || {}), subgraph);
    }
  },

  _fetchById: function(record, id, subgraph) {
    var adapter = get(this, 'adapter'),
        deferred;

    if (adapter.findMany && !adapter.findMany.isUnimplemented) {
      if (this._currentBatchIds) {
        if (!contains(this._currentBatchIds, id)) { this._currentBatchIds.push(id); }
      } else {
        this._currentBatchIds = [id];
        this._currentBatchRecordArrays = [];
      }

      this._updateCurrentBatchSubgraph(subgraph);

      deferred = Ember.RSVP.defer();

      //Attached the record to the deferred so we can resolve it later.
      Ember.set(deferred, 'resolveWith', record);

      if (!this._currentBatchDeferreds) { this._currentBatchDeferreds = []; }
      this._currentBatchDeferreds.push(deferred);

      Ember.run.scheduleOnce('data', this, this._executeBatch, record.container);

      return deferred.promise;
    } else {
      return adapter.find(record, id, subgraph);
    }
  },

  _executeBatch: function(container) {
    var batchIds = this._currentBatchIds,
        batchRecordArrays = this._currentBatchRecordArrays,
        batchDeferreds = this._currentBatchDeferreds,
        batchSubgraph = this._currentBatchSubgraph,
        self = this,
        requestIds = [],
        promise,
        i;

    batchSubgraph = (batchSubgraph === this._FULL_GRAPH) ? undefined : batchSubgraph;

    this._currentBatchIds = null;
    this._currentBatchRecordArrays = null;
    this._currentBatchDeferreds = null;
    this._currentBatchSubgraph = null;

    var cachedRecord;
    for (i = 0; i < batchIds.length; i++) {
      cachedRecord = this.cachedRecordForId(batchIds[i]);
      if (!cachedRecord.isLoadedForGraph(batchSubgraph)) {
        requestIds.push(batchIds[i]);
      }
    }

    if (requestIds.length === 1) {
      promise = get(this, 'adapter').find(this.cachedRecordForId(requestIds[0], container), requestIds[0], batchSubgraph);
    } else {
      var recordArray = Ember.RecordArray.create({_ids: batchIds, container: container});
      if (requestIds.length === 0) {
        promise = new Ember.RSVP.Promise(function(resolve, reject) { resolve(recordArray); });
        recordArray.notifyLoaded();
      } else {
        promise = get(this, 'adapter').findMany(this, recordArray, requestIds, batchSubgraph);
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
    // hliu prevent adding dupes with indexOf check
    if (this._findAllRecordArray && 
          this._findAllRecordArray.get('content') && 
          this._findAllRecordArray.get('content').indexOf(record) === -1) {
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
  findFromCacheOrLoad: function(data, subgraph, container) {
    var record;
    if (!data[get(this, 'primaryKey')]) {
      record = this.create({isLoaded: false, container: container});
    } else {
      record = this.cachedRecordForId(data[get(this, 'primaryKey')], container);
    }
    // set(record, 'data', data);
    record.load(data[get(this, 'primaryKey')], data, subgraph);
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

  _assertIsValidSubgraph: function(subgraph) {
    var diff = graphDiff(subgraph, this.getGraph());
    if (Object.keys(diff).length) {
      Ember.assert('The following graph is not a valid subgraph of ' + this.toString() + ': ' + JSON.stringify(diff), false);
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


})();

(function() {

var supportsComputedGetterSetter;

try {
  Ember.computed({
    get: function() { },
    set: function() { }
  });
  supportsComputedGetterSetter = true;
} catch(e) {
  supportsComputedGetterSetter = false;
}

Ember.Model.computed = function() {
  var polyfillArguments = [];
  var config = arguments[arguments.length - 1];

  if (typeof config === 'function' || supportsComputedGetterSetter) {
    return Ember.computed.apply(null, arguments);
  }

  for (var i = 0, l = arguments.length - 1; i < l; i++) {
    polyfillArguments.push(arguments[i]);
  }

  var func;
  if (config.set) {
    func = function(key, value, oldValue) {
      if (arguments.length > 1) {
        return config.set.call(this, key, value, oldValue);
      } else {
        return config.get.call(this, key);
      }
    };
  } else {
    func = function(key) {
      return config.get.call(this, key);
    };
  }

  polyfillArguments.push(func);

  return Ember.computed.apply(null, polyfillArguments);
};

})();

(function() {

var get = Ember.get;

function getType(record) {
  var type = this.type;

  if (typeof this.type === "string" && this.type) {
    this.type = get(Ember.lookup, this.type);

    if (!this.type) {
      var store = record.container.lookup('store:main');
      this.type = store.modelFor(type);
      this.type.reopenClass({ adapter: store.adapterFor(type) });
    }
  }

  return this.type;
}

Ember.hasMany = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany', getType: getType};

  return Ember.Model.computed({
    get: function(propertyKey) {
      if (this.isDeferredKey(propertyKey)) {
        return this._reloadAndGet(propertyKey);
      }
      
      type = meta.getType(this);
      Ember.assert("Type cannot be empty", !Ember.isEmpty(type));

      var key = options.key || propertyKey;
      return this.getHasMany(key, type, meta, this.container);
    },
    set: function(propertyKey, newContentArray, existingArray) {
      type = meta.getType(this);
      var key = options.key || propertyKey;
      if (!existingArray) {
        existingArray = this.getHasMany(key, type, meta, this.container);
      }
      return existingArray.setObjects(newContentArray);
    }
  }).meta(meta);
};

Ember.Model.reopen({
  getHasMany: function(key, type, meta, container, subgraph) {
    var embedded = meta.options.embedded,
        collectionClass = embedded ? Ember.EmbeddedHasManyArray : Ember.HasManyArray;

    var content = this._getHasManyContent(key, type, embedded);
    var collection = collectionClass.create({
      parent: this,
      modelClass: type,
      content: content,
      embedded: embedded,
      key: key,
      relationshipKey: meta.relationshipKey,
      container: container,
      subgraph: subgraph
    });

    this._registerHasManyArray(collection);

    if (!content || content.length === 0) {
      collection.notifyLoaded();
    }

    return collection;
  }
});


})();

(function() {

var get = Ember.get,
    set = Ember.set;

function storeFor(record) {
  return record.getStore();
}

function getType(record) {
  var type = this.type;

  if (typeof this.type === "string" && this.type) {
    type = Ember.get(Ember.lookup, this.type);

    if (!type) {
      var store = storeFor(record);
      type = store.modelFor(this.type);
      type.reopenClass({ adapter: store.adapterFor(this.type) });
    }
  }

  return type;
}


var getInverseKeyFor = function(obj, type, lookForType) {
  var relKeys = type.getRelationships();
  for (var i = 0, l = relKeys.length; i < l; i++) {
    var key = relKeys[i];
    var rel = type.metaForProperty(key);
    // TODO do we want to reverse hasMany's and belongsTo simulatiously?
    // TODO complain when we can't decide automatically?
    var childType = rel.getType(obj);
    if (childType === lookForType) return key;
  }
  return null;
};

var getInverseKindFor = function(obj, type, lookForKey) {
  var relKeys = type.getRelationships();
  for (var i = 0, l = relKeys.length; i < l; i++) {
    var key = relKeys[i];
    if (lookForKey !== key) continue;
    var rel = type.metaForProperty(key);
    return rel.kind;
  }
  return null;
};

Ember.belongsTo = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'belongsTo', getType: getType};
  var inverseKey;
  var inverseKind;

  return Ember.Model.computed("_data", {
    get: function(propertyKey){
      if (this.isDeferredKey(propertyKey)) {
        return this._reloadAndGet(propertyKey);
      }

      type = meta.getType(this);
      Ember.assert("Type cannot be empty.", !Ember.isEmpty(type));


      var key; 
      if(this.constructor.useBelongsToImplicitKey) {
        key = options.key || propertyKey + '_id';
      } else {
        key = options.key || propertyKey;
      }
      
      var self = this;

      var dirtyChanged = function(sender) {
        if (sender.get('isDirty')) {
          self._relationshipBecameDirty(propertyKey);
        } else {
          self._relationshipBecameClean(propertyKey);
        }
      };

      var store = storeFor(this),
          value = this.getBelongsTo(key, type, meta, store);
      this._registerBelongsTo(meta);
      if (value !== null && meta.options.embedded) {
        value.get('isDirty'); // getter must be called before adding observer
        value.addObserver('isDirty', dirtyChanged);
      }

      if (value == null) {
        var shadow = this.get('_shadow.' + propertyKey);
        if (shadow !== undefined) {
          return shadow;
        }
      }

      return value;
    },

    set: function(propertyKey, value, oldValue){
      type = meta.getType(this);
      Ember.assert("Type cannot be empty.", !Ember.isEmpty(type));

      var key; 
      if(this.constructor.useBelongsToImplicitKey) {
        key = options.key || propertyKey + '_id';
      } else {
        key = options.key || propertyKey;
      }

      

      if(this.get('isNew') && value) {
        if (inverseKey === undefined) {
          if (options.inverse !== undefined) {
            inverseKey = options.inverse;
          } else {
            inverseKey = getInverseKeyFor(this, type, this.constructor);
          }

          if (inverseKey) {
            inverseKind = getInverseKindFor(this, type, inverseKey);
          }
        }


        if (inverseKey && inverseKind === 'hasMany') {
          var hasMany = value.get(inverseKey);
          hasMany.pushShadowObject(this);
        }

        if (inverseKey && inverseKind === 'belongsTo') {
          value.set('_shadow.' + inverseKey, this);
        }
      }

      var dirtyAttributes = get(this, '_dirtyAttributes'),
          createdDirtyAttributes = false,
          self = this;

      var dirtyChanged = function(sender) {
        if (sender.get('isDirty')) {
          self._relationshipBecameDirty(propertyKey);
        } else {
          self._relationshipBecameClean(propertyKey);
        }
      };

      if (!dirtyAttributes) {
        dirtyAttributes = [];
        createdDirtyAttributes = true;
      }

      if (value) {
        Ember.assert(Ember.String.fmt('Attempted to set property of type: %@ with a value of type: %@',
                    [value.constructor, type]),
                    value instanceof type);
      }

      if (oldValue !== value) {
        dirtyAttributes.pushObject(propertyKey);
      } else {
        dirtyAttributes.removeObject(propertyKey);
      }

      if (createdDirtyAttributes) {
        set(this, '_dirtyAttributes', dirtyAttributes);
      }

      if (meta.options.embedded) {
        if (oldValue) {
          oldValue.removeObserver('isDirty', dirtyChanged);
        }
        if (value) {
          value.addObserver('isDirty', dirtyChanged);
        }
      }

      return value === undefined ? null : value;
    }
  }).meta(meta);
};

Ember.Model.reopen({
  getBelongsTo: function(key, type, meta, store, subgraph) {
    var idOrAttrs = get(this, '_data.' + key),
        record;

    if (Ember.isNone(idOrAttrs)) {
      return null;
    }

    if (meta.options.embedded) {
      var primaryKey = get(type, 'primaryKey'),
        id = idOrAttrs[primaryKey];
      record = type.create({ isLoaded: false, id: id, container: this.container });
      record.load(id, idOrAttrs);
    } else {
      if (store) {
        record = store._findSync(meta.type, idOrAttrs, subgraph);
      } else {
        record = type.find(idOrAttrs, subgraph);
      }
    }

    return record;
  }
});


})();

(function() {

var get = Ember.get,
    set = Ember.set,
    meta = Ember.meta;

Ember.Model.dataTypes = {};

Ember.Model.dataTypes[Date] = {
  deserialize: function(string) {
    if (!string) { return null; }
    return new Date(string);
  },
  serialize: function (date) {
    if (!date) { return null; }
    return date.toISOString();
  },
  isEqual: function(obj1, obj2) {
    if (obj1 instanceof Date) { obj1 = this.serialize(obj1); }
    if (obj2 instanceof Date) { obj2 = this.serialize(obj2); }
    return obj1 === obj2;
  }
};

Ember.Model.dataTypes[Number] = {
  deserialize: function(string) {
    if (!string && string !== 0) { return null; }
    return Number(string);
  },
  serialize: function (number) {
    if (!number && number !== 0) { return null; }
    return Number(number);
  }
};

function deserialize(value, type) {
  if (type && type.deserialize) {
    return type.deserialize(value);
  } else if (type && Ember.Model.dataTypes[type]) {
    return Ember.Model.dataTypes[type].deserialize(value);
  } else {
    return value;
  }
}

function serialize(value, type) {
  if (type && type.serialize) {
    return type.serialize(value);
  } else if (type && Ember.Model.dataTypes[type]) {
    return Ember.Model.dataTypes[type].serialize(value);
  } else {
    return value;
  }
}

Ember.attr = function(type, options) {
  return Ember.Model.computed("_data", {
    get: function(key){
      if (this.isDeferredKey(key)) {
        return this._reloadAndGet(key);
      }

      var data = get(this, '_data'),
          dataKey = this.dataKey(key),
          dataValue = data && get(data, dataKey);

      if (dataValue==null && options && options.defaultValue!=null) {
        return Ember.copy(options.defaultValue);
      }

      return this.getAttr(key, deserialize(dataValue, type));
    },
    set: function(key, value){
      var data = get(this, '_data'),
          dataKey = this.dataKey(key),
          dataValue = data && get(data, dataKey),
          beingCreated = meta(this).proto === this,
          dirtyAttributes = get(this, '_dirtyAttributes'),
          createdDirtyAttributes = false;
      if (!dirtyAttributes) {
        dirtyAttributes = [];
        createdDirtyAttributes = true;
      }

      if (beingCreated) {
        if (!data) {
          data = {};
          set(this, '_data', data);
        }
        dataValue = data[dataKey] = value;
      }

      if (dataValue !== serialize(value, type)) {
        dirtyAttributes.pushObject(key);
      } else {
        dirtyAttributes.removeObject(key);
      }

      if (createdDirtyAttributes) {
        set(this, '_dirtyAttributes', dirtyAttributes);
      }

      return value;
    }
  }).meta({isAttribute: true, type: type, options: options});
};


})();

(function() {

var get = Ember.get;

Ember.RESTAdapter = Ember.Adapter.extend({
  find: function(record, id, subgraph) {
    var url = this.buildURL(record.constructor, id, subgraph),
        self = this;

    return this.ajax(url).then(function(data) {
      self.didFind(record, id, data, subgraph);
      return record;
    });
  },

  didFind: function(record, id, data, subgraph) {
    var rootKey = get(record.constructor, 'rootKey'),
        dataToLoad = rootKey ? get(data, rootKey) : data;

    record.load(id, dataToLoad, subgraph);
  },

  findAll: function(klass, records, subgraph) {
    var url = this.buildURL(klass),
        self = this;

    return this.ajax(url).then(function(data) {
      self.didFindAll(klass, records, data, subgraph);
      return records;
    });
  },

  didFindAll: function(klass, records, data, subgraph) {
    var collectionKey = get(klass, 'collectionKey'),
        dataToLoad = collectionKey ? get(data, collectionKey) : data;

    records.load(klass, dataToLoad, subgraph);
  },

  findQuery: function(klass, records, params, subgraph) {
    var url = this.buildURL(klass, null, subgraph),
        self = this;

    return this.ajax(url, params).then(function(data) {
      self.didFindQuery(klass, records, params, data, subgraph);
      return records;
    });
  },

  didFindQuery: function(klass, records, params, data, subgraph) {
      var collectionKey = get(klass, 'collectionKey'),
          dataToLoad = collectionKey ? get(data, collectionKey) : data;

      records.load(klass, dataToLoad, subgraph);
  },

  createRecord: function(record) {
    var url = this.buildURL(record.constructor),
        self = this;

    return this.ajax(url, record.toJSON(), "POST").then(function(data) {
      self.didCreateRecord(record, data);
      return record;
    });
  },

  didCreateRecord: function(record, data) {
    this._loadRecordFromData(record, data);
    record.didCreateRecord();
  },

  saveRecord: function(record) {
    var primaryKey = get(record.constructor, 'primaryKey'),
        url = this.buildURL(record.constructor, get(record, primaryKey)),
        self = this;

    return this.ajax(url, record.toJSON(), "PUT").then(function(data) {  // TODO: Some APIs may or may not return data
      self.didSaveRecord(record, data);
      return record;
    });
  },

  didSaveRecord: function(record, data) {
    this._loadRecordFromData(record, data);
    record.didSaveRecord();
  },

  deleteRecord: function(record) {
    var primaryKey = get(record.constructor, 'primaryKey'),
        url = this.buildURL(record.constructor, get(record, primaryKey)),
        self = this;

    return this.ajax(url, record.toJSON(), "DELETE").then(function(data) {  // TODO: Some APIs may or may not return data
      self.didDeleteRecord(record, data);
    });
  },

  didDeleteRecord: function(record, data) {
    record.didDeleteRecord();
  },

  ajax: function(url, params, method, settings) {
    return this._ajax(url, params, (method || "GET"), settings);
  },

  buildURL: function(klass, id, subgraph) {
    // TODO: add a default way of passing the subgraph.
    var urlRoot = get(klass, 'url');
    var urlSuffix = get(klass, 'urlSuffix') || '';
    if (!urlRoot) { throw new Error('Ember.RESTAdapter requires a `url` property to be specified'); }

    if (!Ember.isEmpty(id)) {
      return urlRoot + "/" + id + urlSuffix;
    } else {
      return urlRoot + urlSuffix;
    }
  },

  ajaxSettings: function(url, method) {
    return {
      url: url,
      type: method,
      dataType: "json"
    };
  },

  _ajax: function(url, params, method, settings) {
    if (!settings) {
      settings = this.ajaxSettings(url, method);
    }

    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (params) {
        if (method === "GET") {
          settings.data = params;
        } else {
          settings.contentType = "application/json; charset=utf-8";
          settings.data = JSON.stringify(params);
        }
      }

      settings.success = function(json) {
        Ember.run(null, resolve, json);
      };

      settings.error = function(jqXHR, textStatus, errorThrown) {
        // https://github.com/ebryn/ember-model/issues/202
        if (jqXHR && typeof jqXHR === 'object') {
          jqXHR.then = null;
        }

        Ember.run(null, reject, jqXHR);
      };


      Ember.$.ajax(settings);
   });
  },

  _loadRecordFromData: function(record, data) {
    var rootKey = get(record.constructor, 'rootKey'),
        primaryKey = get(record.constructor, 'primaryKey');
    // handle HEAD response where no data is provided by server
    if (data) {
      data = rootKey ? get(data, rootKey) : data;
      if (!Ember.isEmpty(data)) {
        record.load(data[primaryKey], data);
      }
    }
  }
});


})();

(function() {

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
    name: "data-adapter",

    initialize: function(container, application) {
      application.register('data-adapter:main', DebugAdapter);
    }
  });
});


})();

(function() {

function NIL() {}

Ember.Model.Store = Ember.Object.extend({
  container: null,

  modelFor: function(type) {
    return Ember.Model.detect(type) ? type : this.container.lookupFactory('model:'+type);
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter,
        container = this.container;

    if (adapter/* && adapter !== Ember.Model.adapter*/) {
      return adapter;
    } else {
      adapter = container.lookupFactory('adapter:'+ type) ||
        container.lookupFactory('adapter:application') ||
        container.lookupFactory('adapter:REST');

      return adapter ? adapter.create() : adapter;
    }
  },

  createRecord: function(type, props) {
    var klass = this.modelFor(type);
    klass.reopenClass({adapter: this.adapterFor(type)});
    return klass.create(Ember.merge({container: this.container}, props));
  },

  find: function(type, id, subgraph) {
    if (arguments.length === 1) { id = NIL; }
    return this._find(type, id, subgraph, true);
  },

  _find: function(type, id, subgraph, async) {
    var klass = this.modelFor(type);

    // if (!klass.adapter) {
      klass.reopenClass({adapter: this.adapterFor(type)});
    // }

    if (id === NIL) {
      return klass._findFetchAll(subgraph, async, this.container);
    } else if (Ember.isArray(id)) {
      return klass._findFetchMany(id, subgraph, async, this.container);
    } else if (typeof id === 'object') {
      return klass._findFetchQuery(id, subgraph, async, this.container);
    } else {
      return klass._findFetchById(id, subgraph, async, this.container);
    }
  },

  _findSync: function(type, id, subgraph) {
    return this._find(type, id, subgraph, false);
  }
});

Ember.onLoad('Ember.Application', function(Application) {

  Application.initializer({
    name: "store",

    initialize: function(_, application) {
      // YPBUG: old initialization code used deprecated methods but appears to be
      // the same as the 0.14 tag. Using the newer 0.16 initialization code here.
      var store = application.Store || Ember.Model.Store;
      application.register('store:application', store);
      application.register('store:main', store);

      application.inject('route', 'store', 'store:main');
      application.inject('controller', 'store', 'store:main');
    }
  });

});


})();