var get = Ember.get;

Ember.belongsTo = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'belongsTo' },
      key = options.key;

  return Ember.computed(function() {
    if (typeof type === "string") {
      type = Ember.get(Ember.lookup, type);
    }

    return this.getBelongsTo(key, type, meta);
  }).property('data').meta(meta);
};

Ember.Model.reopen({
  getBelongsTo: function(key, type, meta) {
    var idOrAttrs = get(this, 'data.' + key),
        record;

    if(Ember.isNone(idOrAttrs)) {
      return null;
    }

    if(meta.options.embedded) {
      var primaryKey = get(type, 'primaryKey');
      record = type.create({ isLoaded: false });
      record.load(idOrAttrs[primaryKey], idOrAttrs);
    } else {
      record = type.findById(idOrAttrs);
    }

    return record;
  }
});
