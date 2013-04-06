module("find coalescing");

test("multiple calls to Model#find within the same run loop coalesce into a findMany call", function() {
  expect(2);

  var Model = Ember.Model.extend();

  Model.adapter = {
    find: function() {
      ok(false, "find was called");
    },

    findMany: function(klass, records, ids) {
      ok(true, "findMany was called");
      deepEqual(ids, [1,2,3], "The correct ids were passed into findMany");
    }
  };

  Ember.run(function() {
    Model.find(1);
    Model.find(2);
    Model.find(3);
  });
});