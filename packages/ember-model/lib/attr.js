require('ember-model/computed');
var get = Ember.get,
    set = Ember.set,
    meta = Ember.meta;

Ember.Model.dataTypes = {};

Ember.Model.dataTypes[Date] = {
  deserialize: function(string) {
    if (!string) { return null; }
    return new Date(string);
  },
  serialize: function (date) {
    if (!date) { return null; }
    return date.toISOString();
  },
  isEqual: function(obj1, obj2) {
    if (obj1 instanceof Date) { obj1 = this.serialize(obj1); }
    if (obj2 instanceof Date) { obj2 = this.serialize(obj2); }
    return obj1 === obj2;
  }
};

Ember.Model.dataTypes[Number] = {
  deserialize: function(string) {
    if (!string && string !== 0) { return null; }
    return Number(string);
  },
  serialize: function (number) {
    if (!number && number !== 0) { return null; }
    return Number(number);
  }
};

function deserialize(value, type) {
  if (type && type.deserialize) {
    return type.deserialize(value);
  } else if (type && Ember.Model.dataTypes[type]) {
    return Ember.Model.dataTypes[type].deserialize(value);
  } else {
    return value;
  }
}

function serialize(value, type) {
  if (type && type.serialize) {
    return type.serialize(value);
  } else if (type && Ember.Model.dataTypes[type]) {
    return Ember.Model.dataTypes[type].serialize(value);
  } else {
    return value;
  }
}

Ember.attr = function(type, options) {
  return Ember.Model.computed("_data", {
    get: function(key){
      var data = get(this, '_data'),
          dataKey = this.dataKey(key),
          dataValue = data && get(data, dataKey);

      if (dataValue==null && options && options.defaultValue!=null) {
        return Ember.copy(options.defaultValue);
      }

      return this.getAttr(key, deserialize(dataValue, type));
    },
    set: function(key, value){
      var data = get(this, '_data'),
          dataKey = this.dataKey(key),
          dataValue = data && get(data, dataKey),
          beingCreated = meta(this).proto === this,
          dirtyAttributes = get(this, '_dirtyAttributes'),
          createdDirtyAttributes = false;
      if (!dirtyAttributes) {
        dirtyAttributes = [];
        createdDirtyAttributes = true;
      }

      if (beingCreated) {
        if (!data) {
          data = {};
          set(this, '_data', data);
        }
        dataValue = data[dataKey] = value;
      }

      if (dataValue !== serialize(value, type)) {
        dirtyAttributes.pushObject(key);
      } else {
        dirtyAttributes.removeObject(key);
      }

      if (createdDirtyAttributes) {
        set(this, '_dirtyAttributes', dirtyAttributes);
      }

      return value;
    }
  }).meta({isAttribute: true, type: type, options: options});
};
