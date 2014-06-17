var ID=-1;
Ember.FixtureAdapterExt = Ember.FixtureAdapter.extend({
	_getHasMany : function(klass, id, collName, collClass) {
		var fixtures = klass.FIXTURES_HM,
			ids = (fixtures[id]?fixtures[id][collName]:[]) || [],
			requestedData = []
		for (var i = 0, l = ids.length; i < l; i++) {
			requestedData.push(this._findData(collClass, ids[i]));
		}
		return requestedData;
	},

	loadHasMany : function(record, propName, type, collection) {
        var content = [];
		
		var data = this._getHasMany(record.constructor, Ember.get(record, record.get('constructor.primaryKey')), propName, type);
		
		Em.run.later(this,function() {
			Ember.run(collection, collection.loadData, type, data);
			Ember.run(collection, collection.notifyLoaded);
		}, 500);

        return content;
    },
	
	createRecord: function(record) {
		var klass = record.constructor,
			fixtures = klass.FIXTURES;

		return new Ember.RSVP.Promise(function(resolve, reject) {
			Ember.run.later(this, function() {
				record.id = ID--;
				fixtures.push(klass.findFromCacheOrLoad(record.toJSON()));
				record.didCreateRecord();
				resolve(record);
			}, 0);
		});
    }
});