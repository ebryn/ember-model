require('ember-model/record_array');

Ember.FilteredRecordArray = Ember.RecordArray.extend({
  init: function() {
    if (!this.get('modelClass')) {
      throw new Error('FilteredRecordArrays must be created with a modelClass');
    }
    if (!this.get('filterFunction')) {
      throw new Error('FilteredRecordArrays must be created with a filterFunction');
    }

    var modelClass = this.get('modelClass');
    modelClass.registerRecordArray(this);

    this.updateFilter();
  },

  updateFilter: function() {
    var self = this,
        results = [];
    this.get('modelClass').forEachCachedRecord(function(record) {
      debugger;
      if (self.filterFunction(record)) {
        results.push(record);
      }
    });
    this.set('content', Ember.A(results));
  }
});