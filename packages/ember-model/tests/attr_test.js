var attr = Ember.attr;

module("Ember.attr");

test("when the attr is specified on an object it should Object.create the object", function() {
  var Page = Ember.Model.extend({
    author: attr()
  });
  var originalAuthorObject = {id: 1, name: "Erik"},
      page = Page.create();

  Ember.run(function() {
    page.load(1, {author: originalAuthorObject});
  });

  var newAuthorObject = page.get('author');
  ok(newAuthorObject !== originalAuthorObject, "The objects shouldn't be the same");
});

test("it should recognize array values and convert them to Ember.A", function() {
  var Page = Ember.Model.extend({
    authors: attr()
  });

  var page = Page.create();

  Ember.run(function() {
    page.load(1, { authors: ["Erik", "Eryk"] });
  });

  equal(Ember.typeOf(page.get("authors")), "array");
});
