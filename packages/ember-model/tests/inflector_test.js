module("Ember.Model.Inflector");

var inflector = Ember.Model.Inflector;
inflector.irregular('child', 'children');
inflector.uncountable('sheep');

test("It pluralizes words", function() {
  expect(5);

  equal(inflector.pluralize('car'), 'cars');
  equal(inflector.pluralize('child'), 'children');
  equal(inflector.pluralize('sheep'), 'sheep');
  equal(inflector.pluralize('id'), 'ids');
  equal(inflector.pluralize('ID'), 'IDs');
});

test("It singularizes words", function() {
  expect(5);

  equal(inflector.singularize('cars'), 'car');
  equal(inflector.singularize('children'), 'child');
  equal(inflector.singularize('sheep'), 'sheep');
  equal(inflector.singularize('ids'), 'id');
  equal(inflector.singularize('IDs'), 'ID');
});


test("It pluralizes compound words", function() {
  expect(12);
  equal(inflector.pluralize("super_cat"), "super_cats");
  equal(inflector.pluralize("node_child"), "node_children");
  equal(inflector.pluralize("lost_sheep"), "lost_sheep");
  equal(inflector.pluralize("grant_id"), "grant_ids");

  equal(inflector.pluralize("superCat"), "superCats");
  equal(inflector.pluralize("nodeChild"), "nodeChildren");
  equal(inflector.pluralize("lostSheep"), "lostSheep");
  equal(inflector.pluralize("grantID"), "grantIDs");

  equal(inflector.pluralize("SuperCat"), "SuperCats");
  equal(inflector.pluralize("NodeChild"), "NodeChildren");
  equal(inflector.pluralize("LostSheep"), "LostSheep");
  equal(inflector.pluralize("GrantID"), "GrantIDs");
});

test("It singularizes compound words", function() {
  expect(12);
  equal(inflector.singularize("super_cats"), "super_cat");
  equal(inflector.singularize("node_children"), "node_child");
  equal(inflector.singularize("lost_sheep"), "lost_sheep");
  equal(inflector.singularize("grant_ids"), "grant_id");

  equal(inflector.singularize("superCats"), "superCat");
  equal(inflector.singularize("nodeChildren"), "nodeChild");
  equal(inflector.singularize("lostSheep"), "lostSheep");
  equal(inflector.singularize("grantIDs"), "grantID");

  equal(inflector.singularize("SuperCats"), "SuperCat");
  equal(inflector.singularize("NodeChildren"), "NodeChild");
  equal(inflector.singularize("LostSheep"), "LostSheep");
  equal(inflector.singularize("GrantIDs"), "GrantID");
});

test("It extends prototypes if it should", function() {
  if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.String) {
    equal("foo".pluralize(), "foos");
    equal("foos".singularize(), "foo");
  } else {
    equal("foo".pluralize, undefined);
    equal("foos".singularize, undefined);
  }
});
