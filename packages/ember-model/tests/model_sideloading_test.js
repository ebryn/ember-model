var attr = Ember.attr;

module("Ember.Model sideloading");

test("data can be sideloaded without materializing records", function() {
  expect(3);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr(),
    camelCase: attr()
  });

  Model.adapter = {
    find: function(record, id) {
      ok(false, "Adapter#find shouldn't be called for records with sideloaded data");
    }
  };

  Model.load([{id: 1, name: "Erik", camel_case: "Dromedary"}]);

  var record;
  Ember.run(function() {
    record = Model.find(1);
  });

  ok(record.get('isLoaded'), "Record should be loaded immediately");
  strictEqual(record.get('id'), 1, "Record ID retained successfully");
  strictEqual(record.get('name'), "Erik", "Record name retained successfully");
});

test("sideloading works with camelized attributes", function() {
  expect(1);

  var Model = Ember.Model.extend({
    camelCase: attr()
  });
  Model.camelizeKeys = true;

  Model.load([{id: 1, camel_case: "Dromedary"}]);

  var record;
  Ember.run(function() {
    record = Model.find(1);
  });

  strictEqual(record.get('camelCase'), "Dromedary", "camel cased attributes retained correctly");
});

test("sideloading clears sideload and record cache", function() {
  expect(6);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr(),
    worth: attr()
  });

  Model.adapter = {
    find: function(record, id) {
      ok(false, "Adapter#find shouldn't be called for records with sideloaded data");
    }
  };

  Model.load([{id: 1, name: "Erik", worth: 123456789}]);

  var record;
  Ember.run(function() {
    record = Model.find(1);
  });

  ok(record.get('isLoaded'), "Record should be loaded immediately");
  strictEqual(record.get('id'), 1, "Record ID retained successfully");
  strictEqual(record.get('name'), "Erik", "Record name retained successfully");
  strictEqual(record.get('worth'), 123456789, "Record worth retained successfully");

  Model.load([{id: 1, name: "Erik", worth: 987654321}]);

  strictEqual(record.get('worth'), 987654321, "Record worth retained successfully");

  var record2;
  Ember.run(function() {
    record2 = Model.find(1);
  });

  equal(record, record2, "Record objects should be the same object");
});


test("sideload of record that hasn't been loaded before should load propogating possible embedded information into existing records", function() {
  var childById = {id:1, age:0},
      modelByIdResponse = {id:1, age:1, children:[{id:1, age:1}, {id:2, age:2}]};

  var ChildModel = Ember.Model.extend({
    age: Ember.attr()
  });

  var Model = Ember.Model.extend({
    age: Ember.attr(),
    children: Ember.hasMany(ChildModel, { key: 'children', embedded: true})
  });

  ChildModel.load(childById);
  var child = ChildModel.find(1);

  Model.load(modelByIdResponse);

  equal(child.get('age'), 1, "The correct age is returned");

  var model1 = Model.find(1);
  equal(model1.get('children.firstObject'), child, "The record is the same");
});

test("sideload of embedded records are available to be found even if the parent model hasn't been loaded", function() {
  var modelByIdResponse = {id:1, age:1, children:[{id:1, age:99}, {id:2, age:2}]};

  var ChildModel = Ember.Model.extend({
    age: Ember.attr()
  });

  var Model = Ember.Model.extend({
    age: Ember.attr(),
    children: Ember.hasMany(ChildModel, { key: 'children', embedded: true})
  });
  
  Model.load(modelByIdResponse);

  var child = ChildModel.find(1);

  equal(child.get('age'), 99, "The correct age is returned");
});

test("find order of sideloaded data doesn't return different results", function() {
  var modelSideloadedData  = {id:1, age:1, children:[{id:1, age:121}, {id:2, age:2}]};
  var childSideloadedData = {id:1, age:99};

  var ChildModel = Ember.Model.extend({
    age: Ember.attr()
  });

  var Model = Ember.Model.extend({
    age: Ember.attr(),
    children: Ember.hasMany(ChildModel, { key: 'children', embedded: true})
  });
  
  // load order should define source of truth
  Model.load(modelSideloadedData);
  ChildModel.load(childSideloadedData);

  var ageChildFirst = ChildModel.find(1).get('age');

  // clear cache and do it again parent model find first
  Model.clearCache();
  ChildModel.clearCache();

  // same load order as above
  Model.load(modelSideloadedData);
  ChildModel.load(childSideloadedData);

  var ageModelFirst = Model.find(1).get('children.firstObject.age');

  equal(ageModelFirst, ageChildFirst, "ages are the same regardless of find order");

});

