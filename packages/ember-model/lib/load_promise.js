var get = Ember.get;

Ember.loadPromise = function(target) {
  if (Ember.isNone(target)) {
    return null;
  } else if (target.then) {
    return target;
  } else {
    var deferred = Ember.RSVP.defer();

    if (get(target, 'isLoaded') && !get(target, 'isNew')) {
      deferred.resolve(target);
    } else {
      target.one('didLoad', this, function() {
        deferred.resolve(target);
      });
    }

    return deferred.promise;
  }
};
