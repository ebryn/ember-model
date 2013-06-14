var get = Ember.get;

Ember.HasManyArray = Ember.RecordArray.extend({
  _records: null,

  objectAtContent: function(idx) {
    var klass = get(this, 'modelClass'),
        content = get(this, 'content');

    if (!content.length) { return; }

    var attrs = content.objectAt(idx);

    // TODO: Create a LazilyMaterializedRecordArray class and test it
    if (this._records && this._records[idx]) { return this._records[idx]; }

    var record = klass.create();

    if (!this._records) { this._records = {}; }
    this._records[idx] = record;

    var primaryKey = get(klass, 'primaryKey');
    record.load(attrs[primaryKey], attrs);

    return record;
  },

  create: function(attrs) {
    var klass = get(this, 'modelClass'),
        record = klass.create(attrs);

    this.pushObject(attrs);

    // TODO: Create a LazilyMaterializedRecordArray class and test it
    if (!this._records) { this._records = {}; }
    this._records[get(this, 'length') - 1] = record;

    return record; // FIXME: inject parent's id
  },

  save: function() {
    // TODO: loop over dirty records only
    return Ember.RSVP.all(this.map(function(record) {
      return record.save();
    }));
  }
});
