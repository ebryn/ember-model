var get = Ember.get,
    set = Ember.set;

Ember.attr = function(type) {
  return Ember.computed(function(key, value) {
    var data = get(this, 'data');
    if (!data) {
      data = {};
      set(this, 'data', data);
    }

    if (arguments.length === 2) {
      data[key] = value;
    }

    return data[key];
  }).property('data').meta({isAttribute: true});
};