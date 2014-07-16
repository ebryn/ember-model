var get = Ember.get, set = Ember.set;

Ember.ManyArray = Ember.RecordArray.extend({
  _records: null,
  originalContent: null,
  _modifiedRecords: null,

  unloadObject: function(record) {
    var obj = get(this, 'content').findBy('clientId', record._reference.clientId);
    get(this, 'content').removeObject(obj);

    var originalObj = get(this, 'originalContent').findBy('clientId', record._reference.clientId);
    get(this, 'originalContent').removeObject(originalObj);
  },

  isDirty: function() {
    var originalContent = get(this, 'originalContent'),
        originalContentLength = get(originalContent, 'length'),
        content = get(this, 'content'),
        contentLength = get(content, 'length');

    if (originalContentLength !== contentLength) { return true; }

    if (this._modifiedRecords && this._modifiedRecords.length) { return true; }

    var isDirty = false;

    for (var i = 0, l = contentLength; i < l; i++) {
      if (!originalContent.contains(content[i])) {
        isDirty = true;
        break;
      }
    }

    return isDirty;
  }.property('content.[]', 'originalContent.[]', '_modifiedRecords.[]'),

  objectAtContent: function(idx) {
    var content = get(this, 'content');

    if (!content.length) { return; }
    
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

  replaceContent: function(index, removed, added) {
    added = Ember.EnumerableUtils.map(added, function(record) {
      return record._reference;
    }, this);

    this._super(index, removed, added);
  },

  _contentWillChange: function() {
    var content = get(this, 'content');

    if (content) {
      this.arrayWillChange(content, 0, get(content, 'length'), 0);
      content.removeArrayObserver(this);
      this._setupOriginalContent(content);
    }
  }.observesBefore('content'),

  _contentDidChange: function() {
    var content = get(this, 'content');
    if (content) {
      content.addArrayObserver(this);
      this.arrayDidChange(content, 0, 0, get(content, 'length'));
    }
  }.observes('content'),

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
  },

  revert: function() {
    this._setupOriginalContent();
  },

  _setupOriginalContent: function(content) {
    content = content || get(this, 'content');
    if (content) {
      set(this, 'originalContent', content.slice());
    }
    set(this, '_modifiedRecords', []);
  },

  init: function() {
    this._super();
    this._setupOriginalContent();
    this._contentDidChange();
  },

  recordStateChanged: function(obj, keyName) {
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
        reference = content.objectAt(idx),
        record = reference.record;

    if (record) {
      if (! record.container) {
        record.container = container;
      }
      return record;
    }
    return klass._findFetchById(reference.id, false, container);
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
