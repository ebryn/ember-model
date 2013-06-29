var get = Ember.get;

Ember.ManyArray = Ember.RecordArray.extend({
  _records: null,

  objectAtContent: function(idx) {
    var content = get(this, 'content');

    if (!content.length) { return; }

    // TODO: Create a LazilyMaterializedRecordArray class and test it
    if (this._records && this._records[idx]) { return this._records[idx]; }

    var record = this.materializeRecord(idx);

    if (!this._records) { this._records = {}; }
    this._records[idx] = record;

    return record;
  },

  save: function() {
    // TODO: loop over dirty records only
    return Ember.RSVP.all(this.map(function(record) {
      return record.save();
    }));
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
      record = klass.findById(reference.id);
    }

    return record;
  },

  replaceContent: function(index, removed, added) {
    added = Ember.EnumerableUtils.map(added, function(record) {
      return record._reference;
    }, this);

    this._super(index, removed, added);
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

    this.pushObject(attrs);

    // TODO: Create a LazilyMaterializedRecordArray class and test it
    if (!this._records) { this._records = {}; }
    this._records[get(this, 'length') - 1] = record;

    return record; // FIXME: inject parent's id
  },

  materializeRecord: function(idx) {
    var klass = get(this, 'modelClass'),
        record = klass.create(),
        primaryKey = get(klass, 'primaryKey'),
        content = get(this, 'content'),
        attrs = content.objectAt(idx);

    record.load(attrs[primaryKey], attrs);
    return record;
  },

  toJSON: function() {
    return this.map(function(record) {
      return record.toJSON();
    });
  }
});
