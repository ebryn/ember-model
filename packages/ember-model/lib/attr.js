var get = Ember.get,
    set = Ember.set,
    meta = Ember.meta;

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

      if (dataValue !== value) {
        set(this, 'isDirty', true);
        if (!this._dirtyAttributes) { this._dirtyAttributes = Ember.A(); }
        this._dirtyAttributes.push(key);
      } else {
        set(this, 'isDirty', false);
        if (this._dirtyAttributes) { this._dirtyAttributes.removeObject(key); }
      }
      return value;
    }

    return data && data[key];
  }).property('data').meta({isAttribute: true});
};