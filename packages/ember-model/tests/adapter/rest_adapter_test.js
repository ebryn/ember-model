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

test("findAll uses Ember.get for a collectionKey", function() {
  expect(1);

  RESTModel.reopenClass({
    collectionKey: Ember.computed(function() {
      return 'posts';
    })
  });

  var data = {
        posts: [
          {id: 1, name: 'Erik'},
          {id: 2, name: 'Aaron'}
        ]
      },
      records;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

test("findAll calls didFindAll callback after finishing", function() {
  expect(4);

  var data = {
        posts: [
          {id: 1, name: 'Erik'},
          {id: 2, name: 'Aaron'}
        ]
      },
      records, args, context,
      didFindAll = adapter.didFindAll;

  RESTModel.collectionKey = 'posts';
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didFindAll = function() {
    context = this;
    args = [].slice.call(arguments);
    didFindAll.apply(adapter, arguments);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
  ok(args, "didFindAll callback should have been called");
  deepEqual(args, [RESTModel, records, data], "didFindAll callback should have been called with proper arguments.");
  equal(context, adapter, "context of didFindAll should have been set to adapter");
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

  deepEqual(record.get('_data'), data.post, "The data should be properly loaded");
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

test("findById uses Ember.get to fetch rootKey", function() {
  expect(1);

  RESTModel.reopenClass({
    rootKey: Ember.computed(function() {
      return 'post';
    })
  });

  var data = {
        post: {
          id: 1,
          name: "Erik"
        }
      },
    record;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  equal(record.get('name'), data.post.name, "The data should be properly loaded");
});

test("find calls didFind after finishing", function() {
  expect(4);

  var data = {
        post: {
          id: 1,
          name: "Erik"
        }
      },
    record, args, context,
    didFind = adapter.didFind,
    id = 1;

  RESTModel.rootKey = "post";

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didFind = function() {
    context = this;
    args = [].slice.call(arguments);
    didFind.apply(adapter, arguments);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  equal(record.get('name'), data.post.name, "The data should be properly loaded");
  ok(args, "didFind callback should have been called");
  deepEqual(args, [record, id, data], "didFind callback should have been called with proper arguments.");
  equal(context, adapter, "context of didFind should have been set to adapter");
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
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      records;
      RESTModel.collectionKey = undefined;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findQuery();
  });

  equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
});

test("findQuery loads the data from a specified collectionKey", function() {
  expect(1);

  var data = {
        people: [
          {id: 1, name: 'Erik'},
          {id: 2, name: 'Aaron'}
        ]
      },
      records;
      RESTModel.collectionKey = "people";

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findQuery();
  });

  equal(records.get('length'), data.people.length, "The proper number of items should have been loaded.");
});

test("findQuery uses Ember.get for a collectionKey", function() {
  expect(1);

  RESTModel.reopenClass({
    collectionKey: Ember.computed(function() {
      return 'posts';
    })
  });

  var data = {
        posts: [
          {id: 1, name: 'Erik'},
          {id: 2, name: 'Aaron'}
        ]
      },
      records;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findQuery();
  });

  equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

test("findQuery calls didFindQuery callback after finishing", function() {
  expect(4);

  var data = {
        posts: [
          {id: 1, name: 'Erik'},
          {id: 2, name: 'Aaron'}
        ]
      },
      records, args, context,
      didFindQuery = adapter.didFindQuery,
      params = { foo: 'bar' };

  RESTModel.collectionKey = 'posts';
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didFindQuery = function(klass, records, params, data) {
    context = this;
    args = [].slice.call(arguments);
    didFindQuery.apply(adapter, arguments);
  };

  Ember.run(function() {
    records = RESTModel.findQuery(params);
  });

  equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
  ok(args, "didFindQuery callback should have been called");
  deepEqual(args, [RESTModel, records, params, data], "didFindQuery callback should have been called with proper arguments.");
  equal(context, adapter, "context of didFindQuery should have been set to adapter");
});

test("findQuery with params", function() {
  expect(1);

  Ember.$.ajax = function(settings) {
    deepEqual(settings.data, {foo: 'bar', num: 42});
    return ajaxSuccess();
  };

  Ember.run(RESTModel, RESTModel.find, {foo: 'bar', num: 42});
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
    return ajaxSuccess({post: {id: 1, name: "Erik"}});
  };

  Ember.run(record, record.save);

  ok(!record.get('isNew'), "Record should not be new");
});

test("createRecord calls didCreateRecord", function() {
  expect(5);

  var record = RESTModel.create({name: "Erik"}),
      args, context, didCreateRecord = adapter.didCreateRecord,
      data = {post: {id: 1, name: "Erik"}};

  // ok(record.get('isDirty'), "Record should be dirty");
  ok(record.get('isNew'), "Record should be new");

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didCreateRecord = function(record, data) {
    context = this;
    args = [].slice.call(arguments);
    didCreateRecord.apply(adapter, arguments);
  };

  Ember.run(record, record.save);

  ok(!record.get('isNew'), "Record should not be new");
  ok(args, "didCreateRecord callback should have been called");
  deepEqual(args, [record, data], "didCreateRecord callback should have been called with proper arguments.");
  equal(context, adapter, "context of didCreateRecord should have been set to adapter");
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

test("saveRecord calls didSaveRecord after saving record", function() {
  expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      data = {id: 1, name: "Erik"}, args, didSaveRecord = adapter.didSaveRecord, context;

  record.set('name', "Kris");
  ok(record.get('isDirty'), "Record should be dirty");

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didSaveRecord = function(record, data) {
    context = this;
    args = [].slice.call(arguments);
    didSaveRecord.apply(adapter, arguments);
  };

  Ember.run(record, record.save);

  ok(!record.get('isDirty'), "Record should not be dirty");
  ok(args, "didSaveRecord callback should have been called");
  deepEqual(args, [record, data], "didSaveRecord callback should have been called with proper arguments.");
  equal(context, adapter, "context of didSaveRecord should have been set to adapter");
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

test("deleteRecord calls didDeleteRecord after deleting", function() {
  expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      args, didDeleteRecord = adapter.didDeleteRecord, data = { ok: true }, context;

  ok(!record.get('isDeleted'), "Record should not be deleted");

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didDeleteRecord = function(record, data) {
    context = this;
    args = [].slice.call(arguments);
    didDeleteRecord.apply(adapter, arguments);
  };

  Ember.run(record, record.deleteRecord);

  ok(record.get('isDeleted'), "Record should be deleted");
  ok(args, "didDeleteRecord callback should have been called");
  deepEqual(args, [record, data], "didDeleteRecord callback should have been called with proper arguments.");
  equal(context, adapter, "context of didDeleteRecord should have been set to adapter");
});

module("Ember.RESTAdapter - with an embedded array attribute", {
  setup: function() {
    RESTModel = Ember.Model.extend({
      names: Ember.attr()
    });
    RESTModel.url = "/posts";
    RESTModel.collectionKey = "posts";
    RESTModel.rootKey = "post";
    adapter = RESTModel.adapter = Ember.RESTAdapter.create();
    _ajax = adapter._ajax;
  }
});

test("Model.find([id]) works as expected", function() {
  expect(1);

  var data = {
        post: {
          id: 1,
          name: "Test Title"
        }
      },
      record, records, promise;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  record = Ember.run(RESTModel, RESTModel.find, 1);
  records = Ember.run(RESTModel, RESTModel.find, [1]);

  promise = Ember.run(Ember.RSVP, Ember.RSVP.all, [records, record]);

  Ember.run(promise, promise.then, function() {
    equal(records.get("firstObject"), record);
  });
});

module("Ember.RESTAdapter - with custom ajax settings", {
  setup: function() {
    RESTModel = Ember.Model.extend({
      name: Ember.attr()
    });
    RESTModel.url = "/posts";
    RESTModel.collectionKey = "posts";
    RESTModel.rootKey = "post";
    var CustomAdapter = Ember.RESTAdapter.extend({
      ajaxSettings: function(url, method) {
        return {
          url: url,
          type: method,
          headers: {
            "authentication": "xxx-yyy"
          },
          dataType: "json"
        };
      }
    });
    adapter = RESTModel.adapter = CustomAdapter.create();
    _ajax = adapter._ajax;
  }
});
test("Expect ajax settings to include a custom header", function() {
  var settings = Ember.run(RESTModel.adapter, RESTModel.adapter.ajaxSettings, RESTModel.url, "GET");
  equal(settings.headers.authentication, "xxx-yyy");
  equal(settings.type, "GET");
  equal(settings.url, RESTModel.url);

});

module("Ember.RESTAdapter - with custom ajax settings passed from create", {
  setup: function() {
    RESTModel = Ember.Model.extend({
      name: Ember.attr()
    });
    RESTModel.url = "/posts";
    RESTModel.collectionKey = "posts";
    RESTModel.rootKey = "post";
    adapter = Ember.RESTAdapter.create({
      ajaxSettings: function(url, method) {
        return {
          url: url,
          type: method,
          headers: {
            "authentication": "xxx-yyy"
          },
          dataType: "json"
        };
      }
    });
    _ajax = adapter._ajax;
  }
});

test("Expect ajax settings to include a custom header", function() {
  var settings = Ember.run(adapter, adapter.ajaxSettings, RESTModel.url, "GET");
  equal(settings.headers.authentication, "xxx-yyy");
  equal(settings.type, "GET");
  equal(settings.url, RESTModel.url);

});

test("find with 0", function() {
  expect(3);

  var RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = RESTModel.adapter = Ember.RESTAdapter.create();

  RESTModel.url = '/posts';

  adapter._ajax = function(url, params, method) {
    equal(url, "/posts/0.json");
    equal(params, undefined);
    equal(method, "GET");
    return ajaxSuccess();
  };
  Ember.run(RESTModel, RESTModel.find, 0);
});

test("find() resolves with record", function() {
  expect(1);

  var data = {id: 1, name: 'Erik'},
      record = RESTModel.create();
  
  RESTModel.collectionKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.find(record, 1).then(function(resolve) {
    start();
    ok(resolve === record, "find() resolved with record");
  });
  stop();
});

test("findAll() resolves with records", function() {
  expect(1);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      records = Ember.RecordArray.create();
  
  RESTModel.collectionKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.findAll(RESTModel, records).then(function(resolve) {
    start();
    ok(resolve === records, "findAll() resolved with records");
  });
  stop();
});

test("findQuery() resolves with records", function() {
  expect(1);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      records = Ember.RecordArray.create();
  
  RESTModel.collectionKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.findQuery(RESTModel, records, {}).then(function(resolve) {
    start();
    ok(resolve === records, "findQuery() resolved with records");
  });
  stop();
});

test("createRecord() resolves with record", function() {
  expect(1);

  var data = {id: 1, name: 'Erik'},
      record = RESTModel.create();
  
  RESTModel.rootKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };
  adapter.createRecord(record).then(function(resolve) {
    start();
    ok(resolve === record, "createRecord() resolved with record");
  });
  stop();
});

test("saveRecord() resolves with record", function() {
  expect(1);

  var data = {id: 1, name: 'Erik'},
      record = RESTModel.create({name: 'Ray'});
  
  RESTModel.rootKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };
  adapter.saveRecord(record).then(function(resolve) {
    start();
    ok(resolve === record, "saveRecord() resolved with record");
  });
  stop();
});
