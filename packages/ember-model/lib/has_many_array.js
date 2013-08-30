var get = Ember.get, set = Ember.set;

Ember.ManyArray = Ember.RecordArray.extend({
  _records: null,
  originalContent: null,

  // TODO: make isDirty check more robust
  isDirty: function() {
    var originalContent = get(this, 'originalContent'),
        originalContentLength = get(originalContent, 'length'),
        content = get(this, 'content'),
        contentLength = get(content, 'length');

    if (originalContentLength !== contentLength) { return true; }

    var isDirty = false;

    for (var i = 0, l = contentLength; i < l; i++) {
      if (content[i] !== originalContent[i]) {
        isDirty = true;
        break;
      }
    }

    return isDirty;
  }.property('content.[]', 'originalContent'),

  objectAtContent: function(idx) {
    var content = get(this, 'content');

    if (!content.length) { return; }

    return this.materializeRecord(idx);
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
      content.removeArrayObserver(this);
      set(this, 'originalContent', content.slice());
    }
  }.observesBefore('content'),

  _contentDidChange: function() {
    var content = get(this, 'content');
    if (content) {
      content.addArrayObserver(this);
      this.arrayDidChange(content, 0, 0, get(content, 'length'));
    }
  }.observes('content'),

  arrayWillChange: function(item, idx, removedCnt, addedCnt) {},

  arrayDidChange: function(item, idx, removedCnt, addedCnt) {
    var parent = get(this, 'parent'), relationshipKey = get(this, 'relationshipKey'),
        isDirty = get(this, 'isDirty');

    if (isDirty) {
      parent._relationshipBecameDirty(relationshipKey);
    } else {
      parent._relationshipBecameClean(relationshipKey);
    }
  },

  init: function() {
    this._super();
    this._contentDidChange();
  }
});

Ember.HasManyArray = Ember.ManyArray.extend({
  materializeRecord: function(idx) {
    var klass = get(this, 'modelClass'),
        content = get(this, 'content'),
        reference = content.objectAt(idx),
        record;

    if (reference.record) {
      record = reference.record;
    } else {
      record = klass.find(reference.id);
    }

    return record;
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

  materializeRecord: function(idx) {
    var klass = get(this, 'modelClass'),
        primaryKey = get(klass, 'primaryKey'),
        content = get(this, 'content'),
        reference = content.objectAt(idx),
        attrs = reference.data;

    if (reference.record) {
      return reference.record;
    } else {
      var record = klass.create({ _reference: reference });
      reference.record = record;
      if (attrs) {
        record.load(attrs[primaryKey], attrs);
      }
      return record;
    }
  },

  toJSON: function() {
    return this.map(function(record) {
      return record.toJSON();
    });
  }
});
