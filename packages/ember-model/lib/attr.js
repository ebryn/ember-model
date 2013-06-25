var get = Ember.get,
    set = Ember.set,
    meta = Ember.meta;

function wrapObject(value) {
  if (Ember.isArray(value)) {
    var clonedArray = value.slice();

    // TODO: write test for recursive cloning
    for (var i = 0, l = clonedArray.length; i < l; i++) {
      clonedArray[i] = wrapObject(clonedArray[i]);
    }

    return Ember.A(clonedArray);
  } else if (value && value.constructor === Date) {
    return new Date(value.toISOString());
  } else if (value && typeof value === "object") {
    var clone = Ember.create(value), property;

    for (property in value) {
      if (value.hasOwnProperty(property) && typeof value[property] === "object") {
        clone[property] = wrapObject(value[property]);
      }
    }
    return clone;
  } else {
    return value;
  }
}

Ember.Model.dataTypes = {};

Ember.Model.dataTypes[Date] = {
  deserialize: function(string) {
    if(!string) { return null; }
    return new Date(string);
  },
  serialize: function (date) {
    if(!date) { return null; }
    return date.toISOString();
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
    return wrapObject(value);
  }
}


Ember.attr = function(type) {
  return Ember.computed(function(key, value) {
    var data = get(this, 'data'),
        dataKey = this.dataKey(key),
        dataValue = data && get(data, dataKey),
        beingCreated = meta(this).proto === this;

    if (arguments.length === 2) {
      if (beingCreated && !data) {
        data = {};
        set(this, 'data', data);
        data[dataKey] = value;
      }
      return wrapObject(value);
    }

    return this.getAttr(key, deserialize(dataValue, type));
  }).property('data').meta({isAttribute: true, type: type});
};
