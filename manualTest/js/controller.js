
App.set('roles',function() {
					return App.Role.find();
				}.property()
		);

App.UsersIndexRoute = Em.Route.extend({
	redirect: function() {
		this.transitionTo('users.list')
	}	
});
App.UsersListRoute = Em.Route.extend({
	model : function() {
		return App.User.find();
	},
	actions : {
		save : function() {
			var _this = this;
			this.get('controller.model').save().then(function() {
				_this.transitionTo('users');
			});
		},
		remove : function() {
			this.get('controller.model').set('isDeleted', true);
			this.get('controller.model').save();
			this.transitionTo('users');
		}
	}
});

App.UsersNewRoute = Em.Route.extend({
	model : function() {
		return App.User.create();
	},
	actions : {
		save : function() {
			var _this = this;
			this.get('controller.model').save().then(function() {
				_this.transitionTo('users.edit', _this.get('controller.model'));
			});
		}		
	}
});
App.UsersEditRoute = App.UsersNewRoute.extend({
	model : function(params) {
		return App.User.find(params.user_id);
	}
});

App.UsersNewController=Em.ObjectController.extend({
	actions : {
		addRole : function() {
			this.get('roles').pushObject(App.UserRole.create({user:this.get('model')}));
		},
		removeRole : function(role) {
			role.set('isDeleted', true);
		}
	}
});

App.UsersEditController=App.UsersNewController.extend({

});


App.RolesIndexRoute = Em.Route.extend({
	redirect: function() {
		this.transitionTo('roles.list')
	}	
});
App.RolesListRoute = Em.Route.extend({
	model : function() {
		return App.Role.find();
	}
});
App.RolesNewRoute = Em.Route.extend({
	model : function() {
		return App.Role.create();
	},
	actions : {
		save : function() {
			var _this = this;
			this.get('controller.model').save().then(function() {
				_this.transitionTo('roles.edit', _this.get('controller.model'));
			});
		}		
	}
});
App.RolesEditRoute = App.RolesNewRoute.extend({
	model : function(params) {
		return App.Role.find(params.role_id);
	}
});


App.PositionsIndexRoute = Em.Route.extend({
	redirect: function() {
		this.transitionTo('positions.list')
	}	
});
App.PositionsListRoute = Em.Route.extend({
	model : function() {
		return App.Position.find();
	}
});
App.PositionsNewRoute = Em.Route.extend({
	model : function() {
		return App.Position.create();
	},
	actions : {
		save : function() {
			var _this = this;
			this.get('controller.model').save().then(function() {
				_this.transitionTo('positions.edit', _this.get('controller.model'));
			});
		}		
	}
});
App.PositionsEditRoute = App.PositionsNewRoute.extend({
	model : function(params) {
		return App.Position.find(params.role_id);
	}
});