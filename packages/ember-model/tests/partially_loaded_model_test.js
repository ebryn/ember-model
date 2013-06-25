var Model;

module("Partially loaded records", {
  setup: function() {
    Model = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });

    Model.adapter = Ember.FixtureAdapter.create();
  }
});

test("missingAttributeAccessed is called if the attribute is not loaded", function() {
  expect(1);

  var key, record = Model.create({ isLoaded: false });
  Ember.run(function() {
    record.load(1, {});
  });

  record.missingAttributeAccessed = function(_key) {
    key = _key;
  };

  record.get('name');

  equal(key, 'name', 'missingAttributeAccessed should be called with attribute name "key".');
});

test("missingAttributeAccessed is not called if the attribute is loaded", function() {
  expect(0);

  var key, record = Model.create({ isLoaded: false });
  Ember.run(function() {
    record.load(1, { name: 'Erik' });
  });

  record.missingAttributeAccessed = function(_key) {
    key = _key;
  };

  record.get('name');

  record.missingAttributeAccessed = function(_key) {
    equal(true, false, "missingAttributeAccessed should not be called");
  };

  record.get('name');
});
