require('ember-model/adapter');

var get = Ember.get;

Ember.RESTAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var url = this.buildURL(record.constructor, id),
        rootKey = record.constructor.rootKey;

    return this.ajax(url).then(function(data) {
      var dataToLoad = rootKey ? data[rootKey] : data;
      Ember.run(record, record.load, id, dataToLoad);
    });
  },

  findAll: function(klass, records) {
    var url = this.buildURL(klass),
        collectionKey = klass.collectionKey;

    return this.ajax(url).then(function(data) {
      var dataToLoad = collectionKey ? data[collectionKey] : data;
      Ember.run(records, records.load, klass, dataToLoad);
    });
  },

  findQuery: function(klass, records, params) {
    var url = this.buildURL(klass),
        collectionKey = klass.collectionKey;

    return this.ajax(url, params).then(function(data) {
      var dataToLoad = collectionKey ? data[collectionKey] : data;
      Ember.run(records, records.load, klass, dataToLoad);
    });
  },

  createRecord: function(record) {
    var url = this.buildURL(record.constructor);

    return this.ajax(url, record.toJSON(), "POST").then(function(data) {
      Ember.run(function() {
        record.load(data.id, data); // FIXME: hardcoded ID
        record.didCreateRecord();
      });
    });
  },

  saveRecord: function(record) {
    var url = this.buildURL(record.constructor, get(record, 'id'));

    return this.ajax(url, record.toJSON(), "PUT").then(function() {  // TODO: Some APIs may or may not return data
      Ember.run(record, record.didSaveRecord);
    });
  },

  deleteRecord: function(record) {
    var url = this.buildURL(record.constructor, get(record, 'id'));

    return this.ajax(url, record.toJSON(), "DELETE").then(function() {  // TODO: Some APIs may or may not return data
      Ember.run(record, record.didDeleteRecord);
    });
  },

  ajax: function(url, params, method) {
    return this._ajax(url, params, method || "GET");
  },

  buildURL: function(klass, id) {
    var urlRoot = get(klass, 'url');
    if (!urlRoot) { throw new Error('Ember.RESTAdapter requires a `url` property to be specified'); }

    if (id) {
      return urlRoot + "/" + id + ".json";
    } else {
      return urlRoot + ".json";
    }
  },

  _ajax: function(url, params, method) {
    var settings = {
      url: url,
      type: method,
      dataType: "json"
    };

    if (params && method !== "GET") {
      settings.contentType = "application/json; charset=utf-8";
      settings.data = JSON.stringify(params);
    }

    return Ember.$.ajax(settings);
  }
});
