App.User = Em.Model.extend({
	name : Em.attr(),
	salary : Em.attr(Number),
	birthDate : Em.attr(),
	
	position : Em.belongsTo('App.Position', {key : 'positionId'}),
	manager : Em.belongsTo('App.User', {key : 'managerId'}),
	
	roles : Em.hasMany('App.UserRole', {key : 'roles'})
});
App.User.FIXTURES = [{id:1,name:'yui',positionId:1}]
App.User.FIXTURES_HM = {1 : {roles:[1]} }

App.Position = Em.Model.extend({
	name : Em.attr()
});
App.Position.FIXTURES=  [{id:1, name:'pos1'}]
App.Role = Em.Model.extend({
	name : Em.attr()
});
App.Role.FIXTURES = [{id:1, name:'role1'}];
App.roles = App.Role.find();

App.UserRole = Em.Model.extend({
	user : Em.belongsTo('App.User', {key : 'userId'}),
	role : Em.belongsTo('App.Role', {key : 'roleId'})
});
App.UserRole.FIXTURES=[{id:1, userId:1, roleId:1}]