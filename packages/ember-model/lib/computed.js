var supportsComputedGetterSetter;

try {
  Ember.computed({
    get: function() { },
    set: function() { }
  });
  supportsComputedGetterSetter = true;
} catch(e) {
  supportsComputedGetterSetter = false;
}

Ember.Model.computed = function() {
  var polyfillArguments = [];
  var config = arguments[arguments.length - 1];

  if (typeof config === 'function' || supportsComputedGetterSetter) {
    return Ember.computed.apply(null, arguments);
  }

  for (var i = 0, l = arguments.length - 1; i < l; i++) {
    polyfillArguments.push(arguments[i]);
  }

  var func;
  if (config.set) {
    func = function(key, value, oldValue) {
      if (arguments.length > 1) {
        return config.set.call(this, key, value, oldValue);
      } else {
        return config.get.call(this, key);
      }
    };
  } else {
    func = function(key) {
      return config.get.call(this, key);
    };
  }

  polyfillArguments.push(func);

  return Ember.computed.apply(null, polyfillArguments);
};