var attr = Ember.attr;

QUnit.module("Ember.Model sideloading");

QUnit.test("data can be sideloaded without materializing records", function(assert) {
  assert.expect(3);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr(),
    camelCase: attr()
  });

  Model.adapter = {
    find: function(record, id) {
      assert.ok(false, "Adapter#find shouldn't be called for records with sideloaded data");
    }
  };

  Model.load([{id: 1, name: "Erik", camel_case: "Dromedary"}]);

  var record;
  Ember.run(function() {
    record = Model.find(1);
  });

  assert.ok(record.get('isLoaded'), "Record should be loaded immediately");
  assert.strictEqual(record.get('id'), 1, "Record ID retained successfully");
  assert.strictEqual(record.get('name'), "Erik", "Record name retained successfully");
});

QUnit.test("sideloading works with camelized attributes", function(assert) {
  assert.expect(1);

  var Model = Ember.Model.extend({
    camelCase: attr()
  });
  Model.camelizeKeys = true;

  Model.load([{id: 1, camel_case: "Dromedary"}]);

  var record;
  Ember.run(function() {
    record = Model.find(1);
  });

  assert.strictEqual(record.get('camelCase'), "Dromedary", "camel cased attributes retained correctly");
});

QUnit.test("sideloading clears sideload and record cache", function(assert) {
  assert.expect(6);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr(),
    worth: attr()
  });

  Model.adapter = {
    find: function(record, id) {
      assert.ok(false, "Adapter#find shouldn't be called for records with sideloaded data");
    }
  };

  Model.load([{id: 1, name: "Erik", worth: 123456789}]);

  var record;
  Ember.run(function() {
    record = Model.find(1);
  });

  assert.ok(record.get('isLoaded'), "Record should be loaded immediately");
  assert.strictEqual(record.get('id'), 1, "Record ID retained successfully");
  assert.strictEqual(record.get('name'), "Erik", "Record name retained successfully");
  assert.strictEqual(record.get('worth'), 123456789, "Record worth retained successfully");

  Model.load([{id: 1, name: "Erik", worth: 987654321}]);

  Ember.run(function() {
    record = Model.find(1);
  });

  assert.strictEqual(record.get('name'), "Erik", "Record name retained successfully");
  assert.strictEqual(record.get('worth'), 987654321, "Record worth retained successfully");

});
