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

  isModified: function() {
    var originalContent = get(this, 'originalContent'),
        originalContentLength = get(originalContent, 'length'),
        content = get(this, 'nonShadowedContent'),
        contentLength = get(content, 'length');

    if (originalContentLength !== contentLength) { return true; }

    if (get(this, 'considerChildrenInDirty') && get(this, 'isChildrenDirty')) { return true; }

    var isModified = false;

    for (var i = 0, l = contentLength; i < l; i++) {
      if (!originalContent.contains(content[i])) {
        isModified = true;
        break;
      }
    }

    return isModified;
  }.property('nonShadowedContent.[]', 'originalContent.[]', '_modifiedRecords.[]'),

  isDirty: Ember.computed.alias('isModified'),

  objectAtContent: function(idx) {
    var content = get(this, 'content');

    // GMM add array index guard
    if (!content.length || idx >= content.length) { return; }
    
    // need to add observer if it wasn't materialized before
    var observerNeeded = (content[idx].record) ? false : true;

    var record = this.materializeRecord(idx, this.container);
    if (observerNeeded) {
      var isModifiedRecord = record.get('isModified'), isNewRecord = record.get('isNew');
      if (isModifiedRecord || isNewRecord) { this._modifiedRecords.pushObject(content[idx]); }

      Ember.addObserver(content[idx], 'record.isModified', this, 'recordStateChanged');
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
        Ember.removeObserver(currentItem, 'record.isModified', this, 'recordStateChanged');
      }
    }
  },

  arrayDidChange: function(item, idx, removedCnt, addedCnt) {
    var parent = get(this, 'parent'), relationshipKey = get(this, 'relationshipKey'),
        isModified = get(this, 'isModified');

    var content = item;
    for (var i = idx; i < idx+addedCnt; i++) {
      var currentItem = content[i];
      if (currentItem && currentItem.record) { 
        var isModifiedRecord = currentItem.record.get('isModified'), isNewRecord = currentItem.record.get('isNew'); // why newly created object is not dirty?
        if (isModifiedRecord || isNewRecord) { this._modifiedRecords.pushObject(currentItem); }
        Ember.addObserver(currentItem, 'record.isModified', this, 'recordStateChanged');
        currentItem.record.registerParentHasManyArray(this);
      }
    }

    if (isModified) {
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

    if (obj.record.get('isModified')) {
      if (this._modifiedRecords.indexOf(obj) === -1) { this._modifiedRecords.pushObject(obj); }
      parent._relationshipBecameDirty(relationshipKey);
    } else {
      if (this._modifiedRecords.indexOf(obj) > -1) { this._modifiedRecords.removeObject(obj); }
      if (!this.get('isModified')) {
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
