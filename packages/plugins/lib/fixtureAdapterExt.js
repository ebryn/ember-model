Ember.FixtureAdapterExt = Ember.FixtureAdapter.extend({
	_getHasMany : function(klass, id, collName, collClass) {
		var fixtures = klass.FIXTURES_HM,
			ids = fixtures[id][collName] || [],
			requestedData = []
		for (var i = 0, l = ids.length; i < l; i++) {
			requestedData.push(this._findData(collClass, ids[i]));
		}
		return requestedData;
	},

	loadHasMany : function(record, propName, type, collection) {
        var content = [];
		
		var data = this._getHasMany(record.constructor, Ember.get(record, record.get('constructor.primaryKey')), propName, type);
		
		
			setTimeout(function() {
				var refs = [];
				data.forEach(function(rec) {
					var model = type.create(rec);
					model.load(type, rec);
					
					var reference = type._getOrCreateReferenceForId(rec['id']);
					reference.data = model;
					refs.addObject(reference);
				});
				
				Ember.run(collection, collection.loadData, refs);
				collection.notifyLoaded();
			}, 0);
		

        return content;
    }
});