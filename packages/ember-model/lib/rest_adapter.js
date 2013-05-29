require('ember-model/adapter');

var get = Ember.get;

Ember.RESTAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var url = this.buildURL(record.constructor, id),
        self = this;

    return this.ajax(url).then(function(data) {
      self.didFind.call(self, record, id, data);
    });
  },

  didFind: function(record, id, data) {
    var rootKey = get(record.constructor, 'rootKey'),
        dataToLoad = rootKey ? data[rootKey] : data;

    Ember.run(record, record.load, id, dataToLoad);
  },

  findAll: function(klass, records) {
    var url = this.buildURL(klass),
        self = this;

    return this.ajax(url).then(function(data) {
      self.didFindAll.call(self, klass, records, data);
    });
  },

  didFindAll: function(klass, records, data) {
    var collectionKey = get(klass, 'collectionKey'),
        dataToLoad = collectionKey ? data[collectionKey] : data;

    Ember.run(records, records.load, klass, dataToLoad);
  },

  findQuery: function(klass, records, params) {
    var url = this.buildURL(klass),
        self = this;

    return this.ajax(url, params).then(function(data) {
      self.didFindQuery.call(self, klass, records, params, data);
    });
  },

  didFindQuery: function(klass, records, params, data) {
      var collectionKey = get(klass, 'collectionKey'),
          dataToLoad = collectionKey ? data[collectionKey] : data;

      Ember.run(records, records.load, klass, dataToLoad);
  },

  createRecord: function(record) {
    var url = this.buildURL(record.constructor),
        self = this;

    return this.ajax(url, record.toJSON(), "POST").then(function(data) {
      self.didCreateRecord.call(self, record, data);
    });
  },

  didCreateRecord: function(record, data) {
    Ember.run(function() {
      record.load(data.id, data); // FIXME: hardcoded ID
      record.didCreateRecord();
    });
  },

  saveRecord: function(record) {
    var url = this.buildURL(record.constructor, get(record, 'id')),
        self = this;

    return this.ajax(url, record.toJSON(), "PUT").then(function(data) {  // TODO: Some APIs may or may not return data
      self.didSaveRecord.call(self, record, data);
    });
  },

  didSaveRecord: function(record, data) {
    Ember.run(record, record.didSaveRecord);
  },

  deleteRecord: function(record) {
    var url = this.buildURL(record.constructor, get(record, 'id')),
        self = this;

    return this.ajax(url, record.toJSON(), "DELETE").then(function(data) {  // TODO: Some APIs may or may not return data
      self.didDeleteRecord.call(self, record, data);
    });
  },

  didDeleteRecord: function(record, data) {
    Ember.run(record, record.didDeleteRecord);
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
