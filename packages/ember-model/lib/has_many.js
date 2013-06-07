var get = Ember.get;

Ember.hasMany = function(klass, key) {
  return Ember.computed(function() {
    return Ember.HasManyArray.create({
      parent: this,
      modelClass: klass,
      content: get(this, 'data.' + key)
    });
  }).property();
};