var Store = Ember.Object.extend({
  container: null,

  modelFor: function(type) {
    return this.container.lookupFactory('model:'+type);
  },

  adapterFor: function(type) {
    return this.container.lookupFactory('adapter:'+type);
  },

  find: function(type, id) {
    var klass = this.modelFor(type);
    if (!id) {
      return klass.findAll();
    }
    else if (typeof id === 'object') {
      return klass.findQuery(id);
    } else {
      return klass.find(id);
    }
  }
});

Ember.onLoad('Ember.Application', function(Application) {
  Ember.MODEL_FACTORY_INJECTIONS = true;
  Application.initializer({
    name: "store",

    initialize: function(container, application) {
      Ember.MODEL_FACTORY_INJECTIONS = true;
      application.register('store:main', Store, {singleton: true});
      container.optionsForType('model', { instantiate: true, singleton: false });

      container.lookup('store:main').set('container', container);
      application.inject('model', 'store', 'store:main' );
      application.inject('adapter', 'store', 'store:main' );
    }
  });
});
