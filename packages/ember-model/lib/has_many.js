var get = Ember.get;

Ember.hasMany = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany' },
      key = options.key;

  return Ember.computed(function(propertyKey, newContentArray, existingArray) {
    Ember.assert("Type cannot be empty", !Ember.isEmpty(type));
    if (typeof type === "string") {
      type = Ember.get(Ember.lookup, type) || this.container.lookupFactory('model:' + type);
    }

    if (arguments.length > 1) {
      return existingArray.setObjects(newContentArray);
    } else {
      return this.getHasMany(key, type, meta);
    }
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

    return collection;
  }
});
