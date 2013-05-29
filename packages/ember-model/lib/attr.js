var get = Ember.get,
    set = Ember.set,
    meta = Ember.meta;

function wrapObject(value) {
  if (Ember.isArray(value)) {
    return value.slice();
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

Ember.attr = function(type) {
  return Ember.computed(function(key, value) {
    var data = get(this, 'data'),
        dataValue = data && get(data, key),
        beingCreated = meta(this).proto === this;

    if (arguments.length === 2) {
      if (beingCreated) {
        if (!data) {
          data = {};
          set(this, 'data', data);
          data[key] = value;
        }
        return value;
      }

      var isEqual;
      if (type && type.isEqual) {
        isEqual = type.isEqual(dataValue, value);
      } else {
        isEqual = dataValue === value;
      }

      if (!isEqual) {
        if (!this._dirtyAttributes) { this._dirtyAttributes = Ember.A(); }
        this._dirtyAttributes.push(key);
      } else {
        if (this._dirtyAttributes) { this._dirtyAttributes.removeObject(key); }
      }
      return value;
    }

    return wrapObject(dataValue);
  }).property('data').meta({isAttribute: true, type: type});
};
