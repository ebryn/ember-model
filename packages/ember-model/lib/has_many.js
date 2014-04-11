var get = Ember.get;

Ember.hasMany = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany' },
      key = options.key;

  return Ember.computed(function(propertyKey, newContentArray, existingArray) {
    Ember.assert("Type cannot be empty", !Ember.isEmpty(type));
    if (typeof type === "string") {
      
      var typeName = type;
      type = Ember.get(Ember.lookup, typeName);

      if (!type) {
        var store = Ember.Model.Store.create({ container: this.container });
        type = store.modelFor(typeName);
        type.reopenClass({ adapter: store.adapterFor(typeName) });
      }
    }

    if (arguments.length > 1) {
      return existingArray.setObjects(newContentArray);
    } else {
      return this.getHasMany(key, type, meta, this.container);
    }
  }).property().meta(meta);
};

Ember.Model.reopen({
  getHasMany: function(key, type, meta, container) {
    var embedded = meta.options.embedded,
        collectionClass = embedded ? Ember.EmbeddedHasManyArray : Ember.HasManyArray;

    var collection = collectionClass.create({
      parent: this,
      modelClass: type,
      content: this._getHasManyContent(key, type, embedded),
      embedded: embedded,
      key: key,
      relationshipKey: meta.relationshipKey,
      container: container
    });

    this._registerHasManyArray(collection);

    return collection;
  }
});
