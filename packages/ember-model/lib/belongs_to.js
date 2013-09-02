var get = Ember.get,
    set = Ember.set;

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

  return Ember.computed(function(key, value, oldValue) {
    type = meta.getType();

    var dirtyAttributes = get(this, '_dirtyAttributes'),
        createdDirtyAttributes = false;

    if (!dirtyAttributes) {
      dirtyAttributes = [];
      createdDirtyAttributes = true;
    }

    if (arguments.length > 1) {
      if (value) {
        Ember.assert(Ember.String.fmt('Attempted to set property of type: %@ with a value of type: %@',
                     [value.constructor, type]),
                     value instanceof type);

        if (oldValue !== value) {
          dirtyAttributes.pushObject(key);
        } else {
          dirtyAttributes.removeObject(key);
        }

        if (createdDirtyAttributes) {
          set(this, '_dirtyAttributes', dirtyAttributes);
        }
      }
      return value === undefined ? null : value;  
    } else {
      return this.getBelongsTo(relationshipKey, type, meta);
    }
  }).property('_data').meta(meta);
};

Ember.Model.reopen({
  getBelongsTo: function(key, type, meta) {
    var primaryKey = get(type, 'primaryKey'),
        idOrAttrs = get(this, '_data.' + key),
        embedded = meta.options.embedded,
        newRecord = meta.options.newRecord,
        record;

    if (Ember.isNone(idOrAttrs)) {
      return null;
    }

    if (embedded) {
      var id = idOrAttrs[primaryKey],
          reference = type._getReferenceById(id);
      // if newRecord on belongs to, or no record exists
      if(newRecord || !reference || !reference.record){
        record = type.create({ isLoaded: false, id: id });
      } else {
        record = reference.record;
      }
      record.load(id, idOrAttrs);
    } else {
      record = type.find(idOrAttrs);
    }

    return record;
  }
});
