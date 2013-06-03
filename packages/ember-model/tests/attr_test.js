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
