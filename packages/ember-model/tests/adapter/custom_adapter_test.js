var CustomModel;

QUnit.module("Ember.CustomAdapter", {
  beforeEach: function() {
    Ember.CustomAdapter = Ember.Adapter.extend();
    Ember.CustomAdapter.reopenClass({
      toString() {
        return 'Ember.CustomAdapter';
      }
    });
    CustomModel = Ember.Model.extend({
      name: Ember.attr(),
    });
    CustomModel.adapter = Ember.CustomAdapter.create();
  }
});

QUnit.test("throws an error message with class name", function(assert) {
  assert.expect(1);

  assert.throws(function() {
    Ember.run(CustomModel, CustomModel.find(1));
  }, /Ember.CustomAdapter must implement find/);
});
