var get = Ember.get;

function getType() {
  if (typeof this.type === "string") {
    this.type =  Ember.get(Ember.lookup, this.type);
  }
  return this.type;
}

Ember.belongsTo = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'belongsTo', getType: getType },
      relationshipKey = options.key;

  return Ember.computed(function(key, value) {
    type = meta.getType();
    var data = get(this, '_data'),
      beingCreated = Ember.meta(this).proto === this;

    if (arguments.length === 2) {
      if (value) {
        Ember.assert(Ember.String.fmt('Attempted to set property of type: %@ with a value of type: %@',
                     [value.constructor, type]),
                     value instanceof type);
      }
      var result = value === undefined ? null : value;
      if (beingCreated) {
        if (!data) {
          data = {};
          Ember.set(this, '_data', data);
        }
        data[this.dataKey(key)] = result;
      }
      return result;
    } else {
      return this.getBelongsTo(relationshipKey, type, meta);
    }
  }).property('_data').meta(meta);
};

Ember.Model.reopen({
  getBelongsTo: function(key, type, meta) {
    var idOrAttrs = get(this, '_data.' + key),
        record;

    if (Ember.isNone(idOrAttrs)) {
      return null;
    }

    if (meta.options.embedded) {
      var primaryKey = get(type, 'primaryKey');
      record = type.create({ isLoaded: false });
      record.load(idOrAttrs[primaryKey], idOrAttrs);
    } else {
      record = type.find(idOrAttrs);
    }

    return record;
  }
});
