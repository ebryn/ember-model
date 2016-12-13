var get = Ember.get,
    set = Ember.set;

Ember.RecordArray = Ember.ArrayProxy.extend(Ember.Evented, {
  isLoaded: false,
  isLoading: Ember.computed.not('isLoaded'),

  load: function(klass, data, subgraph) {
    set(this, 'content', this.materializeData(klass, data, subgraph));
    this.notifyLoaded();
  },

  loadForFindMany: function(klass) {
    var self = this;
    var content = get(this, '_ids').map(function(id) { return klass.cachedRecordForId(id, self.container); });
    set(this, 'content', Ember.A(content));
    this.notifyLoaded();
  },

  notifyLoaded: function() {
    set(this, 'isLoaded', true);
    this.trigger('didLoad');
  },

  materializeData: function(klass, data, subgraph) {
    var self = this;
    return Ember.A(data.map(function(el) {
      return klass.findFromCacheOrLoad(el, subgraph, self.container); // FIXME
    }));
  },

  reload: function() {
    var modelClass = this.get('modelClass'),
        self = this,
        promises;
    
    set(this, 'isLoaded', false);
    if (modelClass._findAllRecordArray === this) {
      return modelClass.adapter.findAll(modelClass, this);
    } else if (this._query) {
      return modelClass.adapter.findQuery(modelClass, this, this._query);
    } else {
      promises = this.map(function(record) {
        return record.reload();
      });
      return Ember.RSVP.all(promises).then(function(data) {
        self.notifyLoaded();
      });
    }
  }
});
