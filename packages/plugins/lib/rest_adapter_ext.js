

var get = Ember.get, set = Ember.set;

Ember.RESTAdapterExt = Ember.RESTAdapter
    .extend({
      namespace : "rest",

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
        if (Em.typeOf(id)!='undefined' && Em.typeOf(id)!='null' ) {
          return urlRoot + "/" + id;
        } else {
          return urlRoot;
        }
      },

      loadHasMany : function(record, propName, type, collection) {
        var content = [];
        var url = this.namespace + "/" + 
            record.constructor.getDefaultRestUrl() + "/" + 
            record.get('id') + "/" + propName;

        this.ajax(url).then(function(response) {			
			Ember.run(collection, collection.loadData, type, response);
			collection.notifyLoaded();
        });

        return content;
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
  adapter : Ember.RESTAdapterExt.create(),
  isRequested : true,
  getDefaultRestUrl : function() {
    return this.toString().substring(this.toString().lastIndexOf('.') + 1)
        .decamelize() + 's';
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
