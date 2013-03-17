require('ember-model/adapter');

var get = Ember.get;

Ember.RESTAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var url = get(record.constructor, 'url') + "/" + id + ".json";
    Ember.$.getJSON(url, function(data) {
      Ember.run(function() {
        record.load(data);
      });
    });
  },

  findAll: function(klass, records) {
    var url = get(klass, 'url') + ".json";
    Ember.$.getJSON(url, function(data) {
      Ember.run(function() {
        records.load(klass, data);
      });
    });
  },

  createRecord: function(record) {

  },

  saveRecord: function(record) {

  },

  deleteRecord: function(record) {

  }
});