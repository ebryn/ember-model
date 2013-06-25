var attr = Ember.attr;

module("Ember.attr");

test("getAttr hook is called when attribute is fetched", function() {
  expect(2);

  var Page = Ember.Model.extend({
    title: attr()
  });

  var page = Page.create();

  page.getAttr = function(key, value) {
    equal(key, 'title', 'getAttr should be called with key as a first argument');
    return value.toUpperCase();
  };

  Ember.run(function() {
    page.load(1, { title: 'teh article' });
  });

  var title = page.get('title');
  equal(title, 'TEH ARTICLE', 'the value of the attr should be a value returned from getAttr hook');
});

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

test("attr should deserialize when type has a deserialize method", function() {
  var Time = {
    deserialize: function(string) {
      var array = string.split(":");
      return {
        hour: parseInt(array[0], 10),
        min: parseInt(array[1], 10)
      };
    }
  };
  var Post = Ember.Model.extend({
    time: attr(Time)
  });

  var post = Post.create();

  Ember.run(function() {
    post.load(1, {time: "11:39"});
  });

  var time = post.get('time');
  ok(time.hour === 11, "Hour should be 11");
  ok(time.min === 39, "Minute should be 39");
});

test("attr should serialize when type has a serialize method", function() {
  var Time = {
    serialize: function(obj) {
      return obj.hour + ":" + obj.min;
    }
  };
  var Post = Ember.Model.extend({
    time: attr(Time)
  });

  var post;
  Ember.run(function() {
    post = Post.create({time: {hour: 10, min: 11}});
  });

  var json = post.toJSON();
  equal(json.time, '10:11', "Serialized time should be 10:11");
});

test("attr should know how to serialize some built in objects", function() {
  expect(7);

  var Post = Ember.Model.extend({
    date:           attr(Date),
    null_date:      attr(Date),
    missing_date:   attr(Date),
    count:          attr(Number),
    null_number:    attr(Number),
    missing_number: attr(Number),
    zero_count:     attr(Number)
  });

  var post, date = new Date(Date.UTC(2001,0,1, 10, 15, 33));
  Ember.run(function() {
    post = Post.create({date: date, count: '3', null_date: null, null_number: null, zero_count: 0});
  });

  var json = post.toJSON();
  equal(json.date, '2001-01-01T10:15:33.000Z', "Date should be serialized");
  equal(json.null_date, null, "null date attributes should not cause error");
  equal(json.missing_date, null, "missing date attributes should not cause error");
  strictEqual(json.count, 3, "Count should be serialized");
  strictEqual(json.zero_count, 0, "Zero count should be serialized");
  equal(json.null_number, null, "null number attributes should not cause error");
  equal(json.missing_number, null, "missing number attributes should not cause error");
});



test("attr should know how to deserialize some built in objects", function() {
  expect(8);

  var Post = Ember.Model.extend({
    date:           attr(Date),
    date2:          attr(Date),
    null_date:      attr(Date),
    missing_date:   attr(Date),
    count:          attr(Number),
    null_number:    attr(Number),
    missing_number: attr(Number),
    zero_count:     attr(Number)
  });

  var post = Post.create();

  Ember.run(function() {
    post.load(1, {
      date:         '2001-01-01T10:15:33Z',
      count:        '3',
      zero_count:   '0',
      date2:        "Mon Jan 01 2001 10:15:33 GMT+0000 (GMT)",
      null_date:    null,
      null_number:  null
    });
  });

  var date = new Date(Date.UTC(2001,0,1, 10, 15, 33));

  equal(post.get('date').getTime(), date.getTime(), "Date should be deserialized");
  equal(post.get('date2').getTime(), date.getTime(), "Other date format should be deserialized");
  equal(post.get('null_date'), null, "null date attributes should not cause error");
  equal(post.get('missing_date'), null, "missing date attributes should not cause error");
  strictEqual(post.get('count'), 3, "Count should be deserialized");
  strictEqual(post.get('zero_count'), 0, "Zero count should be deserialized");
  equal(post.get('null_number'), null, "null number attributes should not cause error");
  equal(post.get('missing_number'), null, "missing number attributes should not cause error");
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
