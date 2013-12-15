window.App = Em.Application.create({
	
});

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

		

App.roles=function() {
					return App.Role.find();
				}.property();
App.positions=function() {
					return App.Position.find();
				}.property();