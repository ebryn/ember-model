Ember.RecordArray = Ember.ArrayProxy.extend(Ember.Evented, Ember.DeferredMixin, {
  isLoaded: false,
  isLoading: Ember.computed.not('isLoaded'),

  load: function(klass, data) {
    this.set('content', this.materializeData(klass, data));
    this.notifyLoaded();
  },

  notifyLoaded: function() {
    this.set('isLoaded', true);
    this.trigger('didLoad');
    this.resolve(this);
  },

  materializeData: function(klass, data) {
    return Ember.A(data.map(function(el) {
      return klass.findFromCacheOrLoad(el); // FIXME
    }));
  }
});