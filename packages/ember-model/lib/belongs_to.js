require('ember-model/computed');
var get = Ember.get,
    set = Ember.set;

function storeFor(record) {
  if (record.container) {
    return record.container.lookup('emstore:main');
  }

  return null;
}

function getType(record) {
  var type = this.type;

  if (typeof this.type === "string" && this.type) {
    type = Ember.get(Ember.lookup, this.type);

    if (!type) {
      var emstore = storeFor(record);
      type = emstore.modelFor(this.type);
      type.reopenClass({ adapter: emstore.adapterFor(this.type) });
    }
  }

  return type;
}

Ember.belongsTo = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'belongsTo', getType: getType};

  return Ember.Model.computed("_data", {
    get: function(propertyKey){
      type = meta.getType(this);
      Ember.assert("Type cannot be empty.", !Ember.isEmpty(type));

      var key = options.key || propertyKey,
          self = this;

      var dirtyChanged = function(sender) {
        if (sender.get('isDirty')) {
          self._relationshipBecameDirty(propertyKey);
        } else {
          self._relationshipBecameClean(propertyKey);
        }
      };

      var emstore = storeFor(this),
          value = this.getBelongsTo(key, type, meta, emstore);
      this._registerBelongsTo(meta);
      if (value !== null && meta.options.embedded) {
        value.get('isDirty'); // getter must be called before adding observer
        value.addObserver('isDirty', dirtyChanged);
      }
      return value;
    },

    set: function(propertyKey, value, oldValue){
      type = meta.getType(this);
      Ember.assert("Type cannot be empty.", !Ember.isEmpty(type));

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
        Ember.assert('Attempted to set property of type: ' + value.constructor + ' with a value of type: ' + type, value instanceof type);
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
  getBelongsTo: function(key, type, meta, emstore) {
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
      if (emstore) {
        record = emstore._findSync(meta.type, idOrAttrs);
      } else {
        record = type.find(idOrAttrs);
      }
    }

    return record;
  }
});
