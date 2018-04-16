function NIL() {}

Ember.Model.Store = Ember.Service.extend({
  modelFor: function(type) {
    return Ember.getOwner(this).factoryFor('model:' + type).class;
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter;
    var owner = Ember.getOwner(this);

    if (adapter && adapter !== Ember.Model.adapter) {
      return adapter;
    } else {
      adapter = owner.factoryFor('adapter:' + type) ||
        owner.factoryFor('adapter:application') ||
        owner.factoryFor('adapter:REST');

      return adapter ? adapter.create() : adapter;
    }
  },

  createRecord: function(type, props) {
    var klass = this.modelFor(type);
    klass.reopenClass({adapter: this.adapterFor(type)});

    var record = klass.create(props);

    var owner = Ember.getOwner(this);
    Ember.setOwner(record, owner);

    return record;
  },

  find: function(type, id) {
    if (arguments.length === 1) { id = NIL; }
    return this._find(type, id, true);
  },

  _find: function(type, id, isAsync) {
    var klass = this.modelFor(type);

    // if (!klass.adapter) {
      klass.reopenClass({adapter: this.adapterFor(type)});
    // }

    var owner = Ember.getOwner(this);

    if (id === NIL) {
      return klass._findFetchAll(isAsync, owner);
    } else if (Ember.isArray(id)) {
      return klass._findFetchMany(id, isAsync, owner);
    } else if (typeof id === 'object') {
      return klass._findFetchQuery(id, isAsync, owner);
    } else {
      return klass._findFetchById(id, isAsync, owner);
    }
  },

  _findSync: function(type, id) {
    return this._find(type, id, false);
  }
});

Ember.onLoad('Ember.Application', function(Application) {

  Application.initializer({
    name: "emstore",

    initialize: function() {
      var application = arguments[1] || arguments[0];
      var store = application.Store || Ember.Model.Store;
      application.register('emstore:application', store);
      application.register('emstore:main', store);

      application.inject('route', 'emstore', 'emstore:main');
      application.inject('controller', 'emstore', 'emstore:main');
    }
  });

});
