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

test("attr should not change null to object", function() {
  var Page = Ember.Model.extend({
    author: attr()
  });
  var page = Page.create();

  Ember.run(function() {
    page.load(1, {author: null});
  });

  var author = page.get('author');
  equal(author, null, "author should be set to null");
});

test("it should recognize array values and clone the whole array", function() {
  var Page = Ember.Model.extend({
    authors: attr()
  });

  var page = Page.create(),
      origArray = ["Erik", "Eryk"];

  Ember.run(function() {
    page.load(1, { authors: origArray });
  });

  ok(page.get("authors") !== origArray, "attribute's data array should be cloned");
  equal(Ember.typeOf(page.get("authors")), "array");
});

test("attr should camelize attributes when reading", function() {
  var Page = Ember.Model.extend({
    someAuthor: attr()
  });
  Page.camelizeKeys = true;

  var page = Page.create();

  Ember.run(function() {
    page.load(1, {some_author: "Alex"});
  });

  var someAuthor = page.get('someAuthor');
  equal(someAuthor, "Alex", "author should be set to Alex");
});

test("attr should camelize attributes when writing", function() {
  var Page = Ember.Model.extend({
    someAuthor: attr()
  });
  Page.camelizeKeys = true;
  var page;
  Ember.run(function() {
    page = Page.create({someAuthor: "Alex"});
  });

  var data = page.get('data');
  equal(data.some_author, "Alex", "data.some_author should be set to Alex");
});