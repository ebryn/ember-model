var attr = Ember.attr;

module("Ember.Model sideloading");

test("data can be sideloaded without materializing records", function() {
  expect(1);

  var Model = Ember.Model.extend({
    id: attr(),
    name: attr()
  });
  Model.adapter = {
    find: function(record, id) {
      ok(false, "Adapter#find shouldn't be called for records with sideloaded data");
    }
  };

  Model.load([{id: 1, name: "Erik"}]);

  var record = Model.find(1);
  ok(record.get('isLoaded'), "Record should be loaded immediately");
  // ok(record.get('isLoaded'), "Record should be loaded immediately");
});