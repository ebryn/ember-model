var attr = Ember.attr;

module("Ember.Model sideloading");

test("data can be sideloaded without materializing records", function() {
  expect(1);

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

  var record = Model.find(1);
  ok(record.get('isLoaded'), "Record should be loaded immediately");
  strictEqual(record.get('id'), 1, "Record ID retained successfully");
  strictEqual(record.get('name'), "Erik", "Record name retained successfully");
  strictEqual(record.get('camelCase'), "Dromedary", "camel cased attributes retained correctly");
  // ok(record.get('isLoaded'), "Record should be loaded immediately");
});
