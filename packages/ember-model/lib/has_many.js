var get = Ember.get;

Ember.hasMany = function(klassOrString, key) {
  return Ember.computed(function() {
    var klass;

    if (typeof klassOrString === "string") {
      klass = Ember.get(Ember.lookup, klassOrString);
    } else {
      klass = klassOrString;
    }

    return Ember.HasManyArray.create({
      parent: this,
      modelClass: klass,
      content: get(this, 'data.' + key)
    });
  }).property();
};
