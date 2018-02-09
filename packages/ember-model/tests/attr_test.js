var attr = Ember.attr;

QUnit.module("Ember.attr");

QUnit.test("getAttr hook is called when attribute is fetched", function(assert) {
  assert.expect(2);

  var Page = Ember.Model.extend({
    title: attr()
  });

  var page = Page.create();

  page.getAttr = function(key, value) {
    assert.equal(key, 'title', 'getAttr should be called with key as a first argument');
    return value.toUpperCase();
  };

  Ember.run(function() {
    page.load(1, { title: 'teh article' });
  });

  var title = page.get('title');
  assert.equal(title, 'TEH ARTICLE', 'the value of the attr should be a value returned from getAttr hook');
});

QUnit.test("attr should not change null to object", function(assert) {
  var Page = Ember.Model.extend({
    author: attr()
  });
  var page = Page.create();

  Ember.run(function() {
    page.load(1, {author: null});
  });

  var author = page.get('author');
  assert.equal(author, null, "author should be set to null");
});

QUnit.test("attr should deserialize when type has a deserialize method", function(assert) {
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
  assert.ok(time.hour === 11, "Hour should be 11");
  assert.ok(time.min === 39, "Minute should be 39");
});

QUnit.test("attr should serialize when type has a serialize method", function(assert) {
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
  assert.equal(json.time, '10:11', "Serialized time should be 10:11");
});

QUnit.test("attr should know how to serialize some built in objects", function(assert) {
  assert.expect(7);

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
  assert.equal(json.date, '2001-01-01T10:15:33.000Z', "Date should be serialized");
  assert.equal(json.null_date, null, "null date attributes should not cause error");
  assert.equal(json.missing_date, null, "missing date attributes should not cause error");
  assert.strictEqual(json.count, 3, "Count should be serialized");
  assert.strictEqual(json.zero_count, 0, "Zero count should be serialized");
  assert.equal(json.null_number, null, "null number attributes should not cause error");
  assert.equal(json.missing_number, null, "missing number attributes should not cause error");
});



QUnit.test("attr should know how to deserialize some built in objects", function(assert) {
  assert.expect(8);

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

  assert.equal(post.get('date').getTime(), date.getTime(), "Date should be deserialized");
  assert.equal(post.get('date2').getTime(), date.getTime(), "Other date format should be deserialized");
  assert.equal(post.get('null_date'), null, "null date attributes should not cause error");
  assert.equal(post.get('missing_date'), null, "missing date attributes should not cause error");
  assert.strictEqual(post.get('count'), 3, "Count should be deserialized");
  assert.strictEqual(post.get('zero_count'), 0, "Zero count should be deserialized");
  assert.equal(post.get('null_number'), null, "null number attributes should not cause error");
  assert.equal(post.get('missing_number'), null, "missing number attributes should not cause error");
});

QUnit.test("attr should camelize attributes when reading", function(assert) {
  var Page = Ember.Model.extend({
    someAuthor: attr()
  });
  Page.camelizeKeys = true;

  var page = Page.create();

  Ember.run(function() {
    page.load(1, {some_author: "Alex"});
  });

  var someAuthor = page.get('someAuthor');
  assert.equal(someAuthor, "Alex", "author should be set to Alex");
});

QUnit.test("attr should camelize attributes when writing", function(assert) {
  var Page = Ember.Model.extend({
    someAuthor: attr()
  });
  Page.camelizeKeys = true;
  var page;
  Ember.run(function() {
    page = Page.create({someAuthor: "Alex"});
  });

  var data = page.get('_data');
  assert.equal(data.some_author, "Alex", "data.some_author should be set to Alex");
  var json = page.toJSON();
  assert.equal(json.some_author, "Alex", "json.some_author should be set to Alex");
});

QUnit.test("toJSON should respect the key option in attr", function(assert) {
  var Page = Ember.Model.extend({
    author: attr(String, { key: 'Author'})
  });
  var page = Page.create();

  Ember.run(function() {
    page.load(1, { Author: "Guilherme" });
  });

  var json = page.toJSON();
  assert.equal(page.get('author'), "Guilherme", "author should be Guilherme");
  assert.equal(page.get('Author'), undefined, "Author should be undefined");
  assert.equal(json.Author, "Guilherme", "json.Author should be Guilherme");
  assert.equal(json.author, undefined, "json.author should be undefined");
});

QUnit.test("custom attributes should revert correctly", function(assert) {
  var Time = {
    serialize: function (time) {
      return time.hour + ":" + time.min;
    },
    deserialize: function (string) {
      var array = string.split(":");
      return {
        hour: parseInt(array[0], 10),
        min: parseInt(array[1], 10)
      };
    }
  };


  var Post = Ember.Model.extend({
    time: Ember.attr(Time)
  });


  var post = Post.create({});
  post.load(1, { time: "10:11" });


  var t0 = post.get('time');
  assert.equal(t0.hour, 10, "Time should have correct hour");
  assert.equal(t0.min, 11, "Time should have correct minute");


  post.set('time', { hour: 11, min: 12 });


  var t1 = post.get('time');
  assert.equal(t1.hour, 11, "Time should have correct hour");
  assert.equal(t1.min, 12, "Time should have correct minute");

  post.revert();
  var t2 = post.get('time');
  assert.equal(t2.hour, 10, "Time should have correct hour");
  assert.equal(t2.min, 11, "Time should have correct minute");

  // should not be dirty now
  assert.ok(post.get('isDirty') === false, "model should no longer be dirty after reverting changes");
});

QUnit.test("attr should handle default values", function(assert) {
  var Book = Ember.Model.extend({
    author: attr(String, { defaultValue: 'anonymous'}),
    chapters: attr(String, { defaultValue: []})
  });
  var novel = Book.create();
  var coloringBook = Book.create();

  Ember.run(function() {
    novel.load(1, { author: "Jane" });
    coloringBook.load(1, { });
  });
  novel.get("chapters").push('intro');

  assert.equal(novel.get('author'), "Jane", "author should be Jane");
  assert.equal(coloringBook.get('author'), "anonymous", "missing author should be filled in");
  assert.deepEqual(novel.get('chapters'), ['intro'], "mutable defaults should be filled in");
  assert.deepEqual(coloringBook.get('chapters'), [], "mutable defaults should not be shared");

  var json = coloringBook.toJSON();
  assert.equal(json.author, "anonymous", "default values should be serialized");
  assert.deepEqual(json.chapters, [], "default values should be serialized");
});
