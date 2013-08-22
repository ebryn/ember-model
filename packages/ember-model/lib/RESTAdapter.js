var get = Ember.get, set = Ember.set;
var Ext = window.Ext || {};

Ext.RESTAdapter = Ember.RESTAdapter
    .extend({
      namespace : "rest",

      findQuery : function(klass, records, params) {
        var urlRoot = this.namespace + "/" + klass.getDefaultRestUrl();
        return this.ajax( urlRoot,  params);
      },

      
      findMany : function(klass, records, ids) {
        var urlRoot = this.namespace + "/" + klass.getDefaultRestUrl();
        return this.ajax(urlRoot, {
            ids : ids
          }
        ).then(function(response) {
          records.load(klass, response);
        });
      },

      buildURL : function(klass, id) {
        var urlRoot = get(klass, 'url');
        if (!urlRoot) {
          urlRoot = klass.getDefaultRestUrl();
        }
        urlRoot = this.namespace + "/" + urlRoot;
        if (id) {
          return urlRoot + "/" + id;
        } else {
          return urlRoot;
        }
      },

      loadHasMany : function(record, propName, type, records) {
        var content = [];
        var url = this.namespace + "/" + 
            record.constructor.getDefaultRestUrl() + "/" + 
            record.get('id') + "/" + propName;

        this.ajax(url).then(function(response) {
          response.forEach(function(rec) {
            var model = type.create(rec);
            model.load(type, rec);
            
            var reference = type._referenceForId(rec['id']);
            reference.data = model;
            content.addObject(reference);
          });
          //records.load(type, response);
          //records.notifyLoaded();
        });

        return content;
      },

      didCreateRecord : function(record, data) {
        var rootKey = get(record.constructor, 'rootKey'), primaryKey = get(
            record.constructor, 'primaryKey'), dataToLoad = rootKey ? data[rootKey]
            : data;
        record.load(dataToLoad[primaryKey], dataToLoad);
        record[primaryKey] = dataToLoad[primaryKey];
        
        record.didCreateRecord();
      },
      
      deleteRecord : function(record) {
        var primaryKey = get(record.constructor, 'primaryKey'), 
          url = this.buildURL(record.constructor, get(record,primaryKey)), 
          self = this;
        
        if (get(record,  primaryKey)) {
          return this.ajax(url, record.toJSON(), "DELETE").then(
              function(data) { // TODO: Some APIs may or may
                        // not return data
                self.didDeleteRecord(record, data);
              });
        } else {
          self.didDeleteRecord(record, null);
        }
      },
      
      callRestOnObject : function(record, action, method, data) {
        var primaryKey = get(record.constructor, 'primaryKey');
        var url = this.buildURL(record.constructor, get(record, primaryKey)) + "/" + action;
        return this.ajax(url, data, method || "GET");
      },
      
      callRestOnClass : function(klazz, action, method, data) {
        var url = this.buildURL(klazz) + "/" + action;
        return this.ajax(url, data, method || "GET");
      }

    });

Ember.Model.reopenClass({
  adapter : Ext.RESTAdapter.create(),

  getDefaultRestUrl : function() {
    return this.toString().substring(this.toString().lastIndexOf('.') + 1)
        .decamelize() + 's';
  }
});

Ember.Model.reopenClass({
  _getHasManyContent : function(key, type, embedded) {
    var content = get(this, 'data.' + key);

    if (content) {
      var mapFunction, primaryKey, reference;
      if (embedded) {
        primaryKey = get(type, 'primaryKey');
        mapFunction = function(attrs) {
          reference = type._referenceForId(attrs[primaryKey]);
          reference.data = attrs;
          return reference;
        };
      } else {
        mapFunction = function(id) {
          return type._referenceForId(id);
        };
      }
      content = Ember.EnumerableUtils.map(content, mapFunction);
    } else {
      content = this.adapter.loadHasMany(this, key, type);
    }

    return Ember.A(content || []);
  }
});
Ember.Model.reopen({
  callRestOnObject : function(action, method) {
    return this.constructor.adapter.callRestOnObject(this, action, method);
  }
});
Ember.Model.reopenClass({
  
  callRestOnClass : function(action, method, data) {
    return this.adapter.callRestOnClass(this, action, method, data);
  }

});
  