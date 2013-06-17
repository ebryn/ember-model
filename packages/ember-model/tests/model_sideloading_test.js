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

