var get = Ember.get;

Ember.belongsTo = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'belongsTo' },
      relationshipKey = options.key;

  return Ember.computed(function(key, value) {
    if (typeof type === "string") {
      type = Ember.get(Ember.lookup, type);
    }
    if (arguments.length === 2) {
      if (value) {
        Ember.assert(Ember.String.fmt('Attempted to set property of type: %@ with a value of type: %@',
                     [value.constructor, type]),
                     value instanceof type);
      }
      return value === undefined ? null : value;  
    } else {
      return this.getBelongsTo(relationshipKey, type, meta);
    }
  }).property('data').meta(meta);
};

Ember.Model.reopen({
  getBelongsTo: function(key, type, meta) {
    var idOrAttrs = get(this, 'data.' + key),
        record;

    if (Ember.isNone(idOrAttrs)) {
      return null;
    }

    if (meta.options.embedded) {
      var primaryKey = get(type, 'primaryKey');
      record = type.create({ isLoaded: false });
      record.load(idOrAttrs[primaryKey], idOrAttrs);
    } else {
      record = type.findById(idOrAttrs);
    }

    return record;
  }
});
