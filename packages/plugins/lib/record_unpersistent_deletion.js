

Ember.DeletableHasManyArray = Ember.HasManyArray.extend({

  //--  arrangedContent controlling
  
  arrangedContent : function() {
    var content = this.get('content');
    var arrCnt= [];
    content.forEach(function(item) {
      item.record.addObserver('isDeleted', this, 'contentItemFilterPropertyDidChange');
      
      if (!item.get('isDeleted')) {
        arrCnt.push(item);
      }
    });
    
    return arrCnt;
  }.property('content'),

  contentItemFilterPropertyDidChange : function (item){
    item = this.getReferenceByRecord(item);
    this.addOrRemoveItem (item);
  },
  
  addOrRemoveItem : function(item) {
    if (!item.record.get('isDeleted')) {
      this.get('arrangedContent').pushObject(item);
    } else {
      this.get('arrangedContent').removeObject(item);
    }
  },

  contentArrayDidChange : function(array, idx, removedCount, addedCount) {
    var addedObjects = array.slice(idx, idx + addedCount);
    var that = this;
    addedObjects.forEach(function(item) {
      that.addOrRemoveItem(item);
      item.record.addObserver('isDeleted', that, 'contentItemFilterPropertyDidChange');
    });
    this._super(array, idx, removedCount, addedCount);
  },

  contentArrayWillChange : function (array, idx, removedCount, addedCount) {
    var removedObjects = array.slice(idx, idx+removedCount);
    removedObjects.forEach ( function(item) {
      this.get('arrangedContent').removeObject(item);
      item.record.removeObserver('isDeleted', this, 'contentItemFilterPropertyDidChange');
    });
    this._super(array, idx, removedCount, addedCount);
  },
  
  addObject : function(obj) {
    this.get('content').pushObject(obj);
  },
  
  removeObject : function(obj) {
    this.get('content').removeObject(obj);
  },
  
  //--- support
  
  getReferenceByRecord : function(record) {
    var content = this.get('content');
    return content.findProperty('record', record);
  },
  
  //--- reloaded ember-model methods
  
  objectAtContent : function(idx) {
    var content = Ember.get(this, 'arrangedContent');

    if (!content.length) {
      return;
    }

    return this.materializeRecord(idx);
  },

  materializeRecord : function(idx) {
    var klass = Ember.get(this, 'modelClass'),
        content = Ember.get(this, 'arrangedContent'),
        reference = content.objectAt(idx),
        record;

    if (reference.record) {
      record = reference.record;
    } else {
      record = klass.find(reference.id);
    }

    return record;
  }
});

Ember.Model
    .reopen({
      getHasMany : function(key, type, meta) {
        var embedded = meta.options.embedded, collectionClass = embedded ? Ember.EmbeddedHasManyArray
            : Ember.DeletableHasManyArray;

        var collection = collectionClass.create({
          parent : this,
          modelClass : type,
          content : [],
          embedded : embedded,
          key : key
        });
        
        collection.set('content', this._getHasManyContent(key, type, embedded, collection));

        this._registerHasManyArray(collection);

        return collection;
      },

      save : function() {
        var adapter = this.constructor.adapter;
        Ember.set(this, 'isSaving', true);
        if (Ember.get(this, 'isDeleted')) {
          return this.deleteRecord(this);
        } else if (Ember.get(this, 'isNew')) {
          return adapter.createRecord(this);
        } else if (Ember.get(this, 'isDirty')) {
          return adapter.saveRecord(this);
        } else { // noop, return a resolved promise
          var self = this, promise = new Ember.RSVP.Promise(function(
              resolve, reject) {
            resolve(self);
          });
          Ember.set(this, 'isSaving', false);
          return promise;
        }
      }

    });