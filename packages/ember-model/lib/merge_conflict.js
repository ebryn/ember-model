var MergeConflict = Ember.MergeConflict = function(store, key, originalObject, originalVersion, forkedObject, forkedVersion) {
  this.store = store;
  this.key = key;
  this.objA = originalObject;
  this.versionA = originalVersion;
  this.objB = forkedObject;
  this.versionB = forkedVersion;
};

MergeConflict.prototype = {
  store: null,
  key: null,
  objA: null,
  versionA: null,
  objB: null,
  versionB: null,

  resolve: function(obj) {
    var store = this.store,
        key = this.key;

    store.load(key, obj);
  },

  lastWriteWins: function() {
    var store = this.store,
        key = this.key;

    var currentObj = store.find(key),
        currentVersion = store.versionFor(key);

    if (currentVersion > this.versionA && currentVersion > this.versionB) {
      this.resolve(currentObj);
    } else if (this.versionA > this.versionB && this.versionA > currentVersion) {
      this.resolve(this.objA);
    } else {
      this.resolve(this.objB);
    }
  }
};