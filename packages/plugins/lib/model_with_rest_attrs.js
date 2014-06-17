var emberize = function(object) {
    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            if (Ember.typeOf(object[i]) == 'object') {
                object[i] = emberize(object[i]);
            }
        }
    }
    return Em.Object.create(object);
};
	
Ember.Model.reopenClass({
	
	makeLoadableProp : function(propName, restFunc, transformFunc) {
		var fakePropname = '_'+propName;
		
		var f = function(key, value) {
			if (arguments.length == 2) {
				this.set(fakePropname, value);
				return value;
			} else {
				if (typeof(this.get(fakePropname))=='undefined') {
					var that = this;
					this.callRestOnObject(restFunc).then(function(res) {
						if (transformFunc) {
							res = transformFunc(res);
						} else if (res && typeof res == 'object') {
							res = emberize(res);
						}
						that.set(fakePropname, res);
						that.notifyPropertyChange(propName);
					});
				}
				return this.get(fakePropname);
			}
		}.property();
		
		return f;
	},
	
	makeLoadableArrayProp : function(propName, restFunc, transformFunc) {
		var fakePropname = '_'+propName;
		return function(key, value) {
			if (arguments.length == 1 || arguments[1] == ({}[1])) {
				if (typeof(this.get(fakePropname))=='undefined' || (arguments.length == 2 && arguments[1] == ({}[1])) ) {
					this.set(fakePropname, []);
					var that = this;
					this.callRestOnObject(restFunc).then(function(data) {
						var d = [];
						if (transformFunc) {
							for (var i in data) {
								d.push(transformFunc(i, data[i]));
							}
						} else {
							d = data;
						}
						data = d.sort(function(a, b) {
							return a.id - b.id;
						});
						
						data.forEach(function(item) {
							that.get(fakePropname).addObject(item);
						});
					});
				}
				return this.get(fakePropname);
			} else {
				this.set(fakePropname, value);
				return value;
			}
			
		}.property(fakePropname+'.@each');
	}

});
