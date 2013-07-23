var CustomModel;

module("Ember.CustomAdapter", {
  setup: function() {
    Ember.CustomAdapter = Ember.Adapter.extend();
    CustomModel = Ember.Model.extend({
      name: Ember.attr()
    });
    CustomModel.adapter = Ember.CustomAdapter.create();
  }
});

test("throws an error message with class name", function() {
  expect(1);

  throws(function() {
    Ember.run(CustomModel, CustomModel.find(1));
  }, /Ember.CustomAdapter must implement find/);
});