var get = Ember.get;

function isValidType(type, record) {
  var hasContainer = record.container;
  var isObject = (typeof type === "object" || typeof type === "function");

  if (hasContainer && isObject) {
    return false;
  }

  if (!isObject) {
    if (hasContainer && get(Ember.lookup, type)) {
      return false;
    }
  }

  return true;
}

function getType(record) {
  var type = this.type;

  Ember.assert("Models created from store must define relationships with strings not objects. Using convention 'post' not 'App.Post'", isValidType(this.type, record));

  if (typeof this.type  === "object" || typeof this.type  === "function") {
    return this.type;
  }

  this.type = Ember.get(Ember.lookup, type);

  if (this.type) {
    return this.type;
  }

  else {
    var store = record.container.lookup('store:main');
    this.type = store.modelFor(type);
    this.type.reopenClass({ adapter: store.adapterFor(type) });
    return this.type;
  }
}

Ember.hasMany = function(type, options) {
  options = options || {};

  var meta = { type: type, isRelationship: true, options: options, kind: 'hasMany', getType: getType};

  return Ember.computed(function(propertyKey, newContentArray, existingArray) {
    type = meta.getType(this);
    Ember.assert("Type cannot be empty", !Ember.isEmpty(type));

    var key = options.key || propertyKey;

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
