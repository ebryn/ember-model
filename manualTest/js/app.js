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

App.Stores = Em.Object.extend({
	roles : function() {
					return App.Role.find();
				}.property(),
	positions : function() {
					return App.Position.find();
				}.property(),
	users : function() {
					return App.User.find();
				}.property(),
							
});

App.stores = App.Stores.create();
