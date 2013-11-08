window.App = Em.Application.create({
	
});

App.set('roles',function() {
					return App.Role.find();
				}.property()
		);

App.Router.map(function() {
  this.resource('users', function() {
	this.route('list');
    this.route('edit', { path: '/:user_id' });
	this.route('new');
  });
  
  this.resource('roles', function() {
	this.route('list');
    this.route('edit', { path: '/:role_id' });
	this.route('new');
  });
  
  this.resource('positions', function() {
	this.route('list');
    this.route('edit', { path: '/:pos_id' });
	this.route('new');
  });
});



		

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
			this.get('controller.model').save();
			this.transitionTo('users');
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
			this.get('controller.model').save();
			this.transitionTo('users');
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