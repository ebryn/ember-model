var RESTModel, adapter, _ajax;

function ajaxSuccess(data) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    resolve(data);
  });
}

module("Ember.RESTAdapter", {
  setup: function() {
    RESTModel = Ember.Model.extend({
      name: Ember.attr()
    });
    adapter = RESTModel.adapter = Ember.RESTAdapter.create();
  }
});

test("throws an error if a url isn't provided", function() {
  expect(3);

  throws(function() {
    Ember.run(RESTModel, RESTModel.find);
  }, /requires a `url` property to be specified/);

  throws(function() {
    Ember.run(RESTModel, RESTModel.find, 1);
  }, /requires a `url` property to be specified/);

  throws(function() {
    Ember.run(RESTModel, RESTModel.find, {});
  }, /requires a `url` property to be specified/);
});

module("Ember.RESTAdapter - with a url specified", {
  setup: function() {
    RESTModel = Ember.Model.extend({
      name: Ember.attr()
    });
    RESTModel.url = "/posts";
    RESTModel.collectionKey = "posts";
    RESTModel.rootKey = "post";
    adapter = RESTModel.adapter = Ember.RESTAdapter.create();
    _ajax = adapter._ajax;
  }
});

test("findAll", function() {
  expect(3);

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts.json");
    equal(params, undefined);
    equal(method, "GET");
    return ajaxSuccess();
  };
  Ember.run(RESTModel, RESTModel.find);
});

test("findAll loads the full JSON payload when collectionKey isn't specified", function() {
  expect(1);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      records;
      RESTModel.collectionKey = undefined;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
});

test("findAll loads the proper JSON payload subset when collectionKey is specified", function() {
  expect(1);

  var data = {
        posts: [
          {id: 1, name: 'Erik'},
          {id: 2, name: 'Aaron'}
        ]
      },
      records;
      RESTModel.collectionKey = "posts";

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

test("findById", function() {
  expect(4);

  var data = {
        post: {
          id: 1, 
          name: "Test Title"
        }
      },
      record;

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts/1.json");
    equal(params, undefined);
    equal(method, "GET");
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  deepEqual(record.get('data'), data.post, "The data should be properly loaded");
});

test("findById loads the full JSON payload when rootKey isn't specified", function() {
  expect(1);
  
  var data = {id: 1, name: "Erik"},
      record;
  RESTModel.rootKey = undefined;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  equal(record.get('name'), data.name, "The data should be properly loaded");
});

test("findById loads the proper JSON payload subset when rootKey is specified", function() {
  expect(1);
  
  var data = {
        post: {
          id: 1,
          name: "Erik"
        }
      },
    record;
  RESTModel.rootKey = "post";

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  equal(record.get('name'), data.post.name, "The data should be properly loaded");
});

test("findQuery", function() {
  expect(3);

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts.json");
    deepEqual(params, {foo: 'bar'});
    equal(method, "GET");
    return ajaxSuccess();
  };
  Ember.run(RESTModel, RESTModel.find, {foo: 'bar'});
});

test("findQuery loads the full JSON payload when collectionKey isn't specified", function() {
  expect(1);

  var data = [
        {id: 5, name: 'Erik'},
        {id: 6, name: 'Aaron'}
      ],
      records;
      RESTModel.collectionKey = undefined;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findQuery({me: "me"});
  });

  equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
});

test("findQuery loads the proper JSON payload subset when collectionKey is specified", function() {
  expect(1);

  var data = {
        posts: [
          {id: 7, name: 'Erik'},
          {id: 8, name: 'Aaron'}
        ]
      },
      records;
      RESTModel.collectionKey = "posts";

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findQuery({me: "me"});
  });
  
  equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

test("createRecord", function() {
  expect(5);

  var record = RESTModel.create({name: "Erik"});
  // ok(record.get('isDirty'), "Record should be dirty");
  ok(record.get('isNew'), "Record should be new");

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts.json");
    deepEqual(params, record.toJSON());
    equal(method, "POST");
    return ajaxSuccess({id: 1, name: "Erik"});
  };

  Ember.run(record, record.save);

  ok(!record.get('isNew'), "Record should not be new");
});

test("saveRecord", function() {
  expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false});

  record.set('name', "Kris");
  ok(record.get('isDirty'), "Record should be dirty");

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts/1.json");
    deepEqual(params, record.toJSON());
    equal(method, "PUT");
    return ajaxSuccess({id: 1, name: "Erik"});
  };

  Ember.run(record, record.save);

  ok(!record.get('isDirty'), "Record should not be dirty");
});

test("deleteRecord", function() {
  expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false});
  ok(!record.get('isDeleted'), "Record should not be deleted");

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts/1.json");
    deepEqual(params, record.toJSON());
    equal(method, "DELETE");
    return ajaxSuccess();
  };

  Ember.run(record, record.deleteRecord);

  ok(record.get('isDeleted'), "Record should be deleted");
});
