Ember.Adapter = Ember.Object.extend({
  find: function(record, id) {
    throw new Error('Ember.Adapter subclasses must implement find');
  },

  findAll: function(klass, records) {
    throw new Error('Ember.Adapter subclasses must implement findAll');
  },

  load: function(record, id, data) {
    record.load(id, data);
  },

  createRecord: function(record) {
    throw new Error('Ember.Adapter subclasses must implement createRecord');
  },

  saveRecord: function(record) {
    throw new Error('Ember.Adapter subclasses must implement saveRecord');
  },

  deleteRecord: function(record) {
    throw new Error('Ember.Adapter subclasses must implement deleteRecord');
  }
});