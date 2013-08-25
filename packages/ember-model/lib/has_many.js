var get = Ember.get;

Ember.hasMany = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany' },
      key = options.key;

  return Ember.computed(function() {
    if (typeof type === "string") {
      type = Ember.get(Ember.lookup, type);
    }

    return this.getHasMany(key, type, meta);
  }).property().meta(meta);
};

Ember.Model.reopen({
  getHasMany: function(key, type, meta) {
    var embedded = meta.options.embedded,
        collectionClass = embedded ? Ember.EmbeddedHasManyArray : Ember.HasManyArray;

    var collection = collectionClass.create({
      parent: this,
      modelClass: type,
      content: this._getHasManyContent(key, type, embedded),
      embedded: embedded,
      key: key,
      relationshipKey: meta.relationshipKey
    });

    this._registerHasManyArray(collection);
    if (embedded) type.pushIntoRecordCache(collection);

    return collection;
  }
});
