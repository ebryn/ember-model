Ember.Model.Store = Ember.Object.extend({
  container: null,

  modelFor: function(type) {
    return this.container.lookupFactory('model:'+type);
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter;
    if (adapter && adapter !== Ember.Model.adapter) {
      return adapter;
    } else {
      return this.container.lookupFactory('adapter:'+ type) ||
        this.container.lookupFactory('adapter:application') ||
        this.container.lookupFactory('adapter:REST');
    }
  },

  createRecord: function(type) {
    var klass = this.modelFor(type);
    klass.reopenClass({adapter: this.adapterFor(type)});
    return klass.create({container: this.container});
  },

  find: function(type, id) {
    var klass = this.modelFor(type);
    klass.reopenClass({adapter: this.adapterFor(type)});
    if (!id) {
      return klass._findFetchAll(true, this.container);
    } else if (Ember.isArray(id)) {
      return klass._findFetchMany(id, true, this.container);
    }else if (typeof id === 'object') {
      return klass._findFetchQuery(id, true, this.container);
    } else {
    return klass._findFetchById(id, true, this.container);
    }
  }
});

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: "store",

    initialize: function(container, application) {
      application.register('store:main', Ember.Model.Store);

      application.inject('route', 'store', 'store:main');
      application.inject('controller', 'store', 'store:main');
    }
  });
});
