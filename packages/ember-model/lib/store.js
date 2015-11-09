function NIL() {}

Ember.Model.Store = Ember.Object.extend({
  container: null,

  modelFor: function(type) {
    return Ember.Model.detect(type) ? type : this.container.lookupFactory('model:'+type);
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter,
        container = this.container;

    if (adapter/* && adapter !== Ember.Model.adapter*/) {
      return adapter;
    } else {
      adapter = container.lookupFactory('adapter:'+ type) ||
        container.lookupFactory('adapter:application') ||
        container.lookupFactory('adapter:REST');

      return adapter ? adapter.create() : adapter;
    }
  },

  createRecord: function(type, props) {
    var klass = this.modelFor(type);
    klass.reopenClass({adapter: this.adapterFor(type)});
    return klass.create(Ember.merge({container: this.container}, props));
  },

  find: function(type, id) {
    if (arguments.length === 1) { id = NIL; }
    return this._find(type, id, true);
  },

  _find: function(type, id, async) {
    var klass = this.modelFor(type);

    // if (!klass.adapter) {
      klass.reopenClass({adapter: this.adapterFor(type)});
    // }

    if (id === NIL) {
      return klass._findFetchAll(async, this.container);
    } else if (Ember.isArray(id)) {
      return klass._findFetchMany(id, async, this.container);
    } else if (typeof id === 'object') {
      return klass._findFetchQuery(id, async, this.container);
    } else {
      return klass._findFetchById(id, async, this.container);
    }
  },

  _findSync: function(type, id) {
    return this._find(type, id, false);
  }
});

Ember.onLoad('Ember.Application', function(Application) {

  Application.initializer({
    name: "store",

    initialize: function(_, application) {
      // YPBUG: old initialization code used deprecated methods but appears to be
      // the same as the 0.14 tag. Using the newer 0.16 initialization code here.
      var store = application.Store || Ember.Model.Store;
      application.register('store:application', store);
      application.register('store:main', store);

      application.inject('route', 'store', 'store:main');
      application.inject('controller', 'store', 'store:main');
    }
  });

});
