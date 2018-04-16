var RESTModel, adapter, _ajax;

function ajaxSuccess(data) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    resolve(data);
  });
}

QUnit.module("Ember.RESTAdapter", {
  beforeEach: function() {
    RESTModel = Ember.Model.extend({
      name: Ember.attr()
    });
    adapter = RESTModel.adapter = Ember.RESTAdapter.create();
  }
});

QUnit.test("throws an error if a url isn't provided", function(assert) {
  assert.expect(3);

  Ember.run(function() {
    assert.throws(function() {
      RESTModel.find();
    }, /requires a `url` property to be specified/);
  });

  Ember.run(function() {
    assert.throws(function() {
      RESTModel.find(1);
    }, /requires a `url` property to be specified/);
  });

  Ember.run(function() {
    assert.throws(function() {
      RESTModel.find({});
    }, /requires a `url` property to be specified/);
  });
});

QUnit.module("Ember.RESTAdapter - with a url specified", {
  beforeEach: function() {
    RESTModel = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });
    RESTModel.url = "/posts";
    RESTModel.collectionKey = "posts";
    RESTModel.rootKey = "post";
    adapter = RESTModel.adapter = Ember.RESTAdapter.create();
    _ajax = adapter._ajax;
  }
});

QUnit.test("findAll", function(assert) {
  assert.expect(3);

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts");
    assert.equal(params, undefined);
    assert.equal(method, "GET");
    return ajaxSuccess({posts: []});
  };
  Ember.run(RESTModel, RESTModel.find);
});

QUnit.test("findAll loads the full JSON payload when collectionKey isn't specified", function(assert) {
  assert.expect(1);

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

  assert.equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
});

QUnit.test("findAll loads the proper JSON payload subset when collectionKey is specified", function(assert) {
  assert.expect(1);

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

  assert.equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

QUnit.test("findAll uses Ember.get for a collectionKey", function(assert) {
  assert.expect(1);

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

  assert.equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

QUnit.test("findAll calls didFindAll callback after finishing", function(assert) {
  assert.expect(4);

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

  assert.equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
  assert.ok(args, "didFindAll callback should have been called");
  assert.deepEqual(args, [RESTModel, records, data], "didFindAll callback should have been called with proper arguments.");
  assert.equal(context, adapter, "context of didFindAll should have been set to adapter");
});

QUnit.test("findById", function(assert) {
  assert.expect(4);

  var data = {
        post: {
          id: 1,
          name: "Test Title"
        }
      },
      record;

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts/1");
    assert.equal(params, undefined);
    assert.equal(method, "GET");
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  assert.deepEqual(record.get('_data'), data.post, "The data should be properly loaded");
});

QUnit.test("findById loads the full JSON payload when rootKey isn't specified", function(assert) {
  assert.expect(1);

  var data = {id: 1, name: "Erik"},
      record;
  RESTModel.rootKey = undefined;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    record = RESTModel.find(1);
  });

  assert.equal(record.get('name'), data.name, "The data should be properly loaded");
});

QUnit.test("findById loads the proper JSON payload subset when rootKey is specified", function(assert) {
  assert.expect(1);

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

  assert.equal(record.get('name'), data.post.name, "The data should be properly loaded");
});

QUnit.test("findById uses Ember.get to fetch rootKey", function(assert) {
  assert.expect(1);

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

  assert.equal(record.get('name'), data.post.name, "The data should be properly loaded");
});

QUnit.test("find calls didFind after finishing", function(assert) {
  assert.expect(4);

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

  assert.equal(record.get('name'), data.post.name, "The data should be properly loaded");
  assert.ok(args, "didFind callback should have been called");
  assert.deepEqual(args, [record, id, data], "didFind callback should have been called with proper arguments.");
  assert.equal(context, adapter, "context of didFind should have been set to adapter");
});

QUnit.test("findQuery", function(assert) {
  assert.expect(3);

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts");
    assert.deepEqual(params, {foo: 'bar'});
    assert.equal(method, "GET");
    return ajaxSuccess({posts: []});
  };
  Ember.run(RESTModel, RESTModel.find, {foo: 'bar'});
});

QUnit.test("findQuery loads the full JSON payload when collectionKey isn't specified", function(assert) {
  assert.expect(1);

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

  assert.equal(records.get('length'), data.length, "The proper number of items should have been loaded.");
});

QUnit.test("findQuery loads the data from a specified collectionKey", function(assert) {
  assert.expect(1);

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

  assert.equal(records.get('length'), data.people.length, "The proper number of items should have been loaded.");
});

QUnit.test("findQuery uses Ember.get for a collectionKey", function(assert) {
  assert.expect(1);

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

  assert.equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
});

QUnit.test("findQuery calls didFindQuery callback after finishing", function(assert) {
  assert.expect(4);

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

  assert.equal(records.get('length'), data.posts.length, "The proper number of items should have been loaded.");
  assert.ok(args, "didFindQuery callback should have been called");
  assert.deepEqual(args, [RESTModel, records, params, data], "didFindQuery callback should have been called with proper arguments.");
  assert.equal(context, adapter, "context of didFindQuery should have been set to adapter");
});

QUnit.test("findQuery with params", function(assert) {
  assert.expect(1);

  adapter._ajax = function(url, params, method) {
    assert.deepEqual(params, {foo: 'bar', num: 42});
    return ajaxSuccess({posts: []});
  };

  Ember.run(RESTModel, RESTModel.find, {foo: 'bar', num: 42});
});

QUnit.test("createRecord", function(assert) {
  assert.expect(5);

  var record = RESTModel.create({name: "Erik"});
  // ok(record.get('isDirty'), "Record should be dirty");
  assert.ok(record.get('isNew'), "Record should be new");

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts");
    assert.deepEqual(params, record.toJSON());
    assert.equal(method, "POST");
    return ajaxSuccess({post: {id: 1, name: "Erik"}});
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isNew'), "Record should not be new");
});

QUnit.test("createRecord calls didCreateRecord", function(assert) {
  assert.expect(5);

  var record = RESTModel.create({name: "Erik"}),
      args, context, didCreateRecord = adapter.didCreateRecord,
      data = {post: {id: 1, name: "Erik"}};

  // ok(record.get('isDirty'), "Record should be dirty");
  assert.ok(record.get('isNew'), "Record should be new");

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didCreateRecord = function(record, data) {
    context = this;
    args = [].slice.call(arguments);
    didCreateRecord.apply(adapter, arguments);
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isNew'), "Record should not be new");
  assert.ok(args, "didCreateRecord callback should have been called");
  assert.deepEqual(args, [record, data], "didCreateRecord callback should have been called with proper arguments.");
  assert.equal(context, adapter, "context of didCreateRecord should have been set to adapter");
});

QUnit.test("createRecord record loads data in response", function(assert) {
  assert.expect(2);

  var data = {post: {id: 1, name: 'Erik 2'}},
      record = RESTModel.create({name: 'Erik'});

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(record, record.save);

  assert.equal(record.get('id'), 1, 'resolved record should have id');
  assert.equal(record.get('name'), 'Erik 2', 'resolved record should have loaded data from server');
});

QUnit.test("saveRecord", function(assert) {
  assert.expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false});

  record.set('name', "Kris");
  assert.ok(record.get('isDirty'), "Record should be dirty");

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts/1");
    assert.deepEqual(params, record.toJSON());
    assert.equal(method, "PUT");
    return ajaxSuccess({id: 1, name: "Erik"});
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isDirty'), "Record should not be dirty");
});

QUnit.test("saveRecord calls didSaveRecord after saving record", function(assert) {
  assert.expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      data = {id: 1, name: "Erik"}, args, didSaveRecord = adapter.didSaveRecord, context;

  record.set('name', "Kris");
  assert.ok(record.get('isDirty'), "Record should be dirty");

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didSaveRecord = function(record, data) {
    context = this;
    args = [].slice.call(arguments);
    didSaveRecord.apply(adapter, arguments);
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isDirty'), "Record should not be dirty");
  assert.ok(args, "didSaveRecord callback should have been called");
  assert.deepEqual(args, [record, data], "didSaveRecord callback should have been called with proper arguments.");
  assert.equal(context, adapter, "context of didSaveRecord should have been set to adapter");
});

QUnit.test("saveRecord loads response data if it exists", function(assert) {
  assert.expect(4);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      responseData = {post: {id: 1, name: "Bill"}};

  record.set('name', 'John');
  assert.ok(record.get('isDirty'), 'Record should be dirty');

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(responseData);
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isDirty'), 'Record should not be dirty');
  assert.ok(!record.get('isSaving'), 'Record should not be saving');
  assert.equal(record.get('name'), 'Bill', 'Record should have loaded the data from the server');
});

QUnit.test("saveRecord does not load empty response", function(assert) {
  assert.expect(4);
  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      responseData = '';

  record.set('name', 'John');
  assert.ok(record.get('isDirty'), 'Record should be dirty');

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(responseData);
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isDirty'), 'Record should not be dirty');
  assert.ok(!record.get('isSaving'), 'Record should not be saving');
  assert.equal(record.get('name'), 'John', 'Record should not have been reloaded.');
});

QUnit.test("saveRecord does not load HEAD response (undefined response body)", function(assert) {
  assert.expect(4);
  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      responseData = '';

  record.set('name', 'John');
  assert.ok(record.get('isDirty'), 'Record should be dirty');

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(undefined);
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isDirty'), 'Record should not be dirty');
  assert.ok(!record.get('isSaving'), 'Record should not be saving');
  assert.equal(record.get('name'), 'John', 'Record should not have been reloaded.');
});

QUnit.test("saveRecord does not load response if root key is missing", function(assert) {
  assert.expect(4);
  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      responseData = {notRootKey: true};

  record.set('name', 'John');
  assert.ok(record.get('isDirty'), 'Record should be dirty');

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(responseData);
  };

  Ember.run(record, record.save);

  assert.ok(!record.get('isDirty'), 'Record should not be dirty');
  assert.ok(!record.get('isSaving'), 'Record should not be saving');
  assert.equal(record.get('name'), 'John', 'Record should not have been reloaded.');
});

QUnit.test("deleteRecord", function(assert) {
  assert.expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false});
  assert.ok(!record.get('isDeleted'), "Record should not be deleted");

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts/1");
    assert.deepEqual(params, record.toJSON());
    assert.equal(method, "DELETE");
    return ajaxSuccess();
  };

  Ember.run(record, record.deleteRecord);

  assert.ok(record.get('isDeleted'), "Record should be deleted");
});

QUnit.test("deleteRecord calls didDeleteRecord after deleting", function(assert) {
  assert.expect(5);

  var record = Ember.run(RESTModel, RESTModel.create, {id: 1, name: "Erik", isNew: false}),
      args, didDeleteRecord = adapter.didDeleteRecord, data = { ok: true }, context;

  assert.ok(!record.get('isDeleted'), "Record should not be deleted");

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  adapter.didDeleteRecord = function(record, data) {
    context = this;
    args = [].slice.call(arguments);
    didDeleteRecord.apply(adapter, arguments);
  };

  Ember.run(record, record.deleteRecord);

  assert.ok(record.get('isDeleted'), "Record should be deleted");
  assert.ok(args, "didDeleteRecord callback should have been called");
  assert.deepEqual(args, [record, data], "didDeleteRecord callback should have been called with proper arguments.");
  assert.equal(context, adapter, "context of didDeleteRecord should have been set to adapter");
});

QUnit.module("Ember.RESTAdapter - with an embedded array attribute", {
  beforeEach: function() {
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

QUnit.test("Model.find([id]) works as expected", function(assert) {
  assert.expect(1);

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
    assert.equal(records.get("firstObject"), record);
  });
});

QUnit.module("Ember.RESTAdapter - with custom ajax settings", {
  beforeEach: function() {
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
QUnit.test("Expect ajax settings to include a custom header", function(assert) {
  var settings = Ember.run(RESTModel.adapter, RESTModel.adapter.ajaxSettings, RESTModel.url, "GET");
  assert.equal(settings.headers.authentication, "xxx-yyy");
  assert.equal(settings.type, "GET");
  assert.equal(settings.url, RESTModel.url);

});

QUnit.module("Ember.RESTAdapter - with custom ajax settings passed from create", {
  beforeEach: function() {
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

QUnit.test("Expect ajax settings to include a custom header", function(assert) {
  var settings = Ember.run(adapter, adapter.ajaxSettings, RESTModel.url, "GET");
  assert.equal(settings.headers.authentication, "xxx-yyy");
  assert.equal(settings.type, "GET");
  assert.equal(settings.url, RESTModel.url);

});

QUnit.test("find with 0", function(assert) {
  assert.expect(3);

  var RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = RESTModel.adapter = Ember.RESTAdapter.create();

  RESTModel.url = '/posts';

  adapter._ajax = function(url, params, method) {
    assert.equal(url, "/posts/0");
    assert.equal(params, undefined);
    assert.equal(method, "GET");
    return ajaxSuccess();
  };
  Ember.run(RESTModel, RESTModel.find, 0);
});

QUnit.test("find() resolves with record", function(assert) {
  assert.expect(1);

  var data = {id: 1, name: 'Erik'},
      record = RESTModel.create();

  RESTModel.collectionKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  var done = assert.async();
  adapter.find(record, 1).then(function(resolve) {
    assert.ok(resolve === record, "find() resolved with record");
    done();
  });
});

QUnit.test("findAll() resolves with records", function(assert) {
  assert.expect(1);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      records = Ember.RecordArray.create();

  RESTModel.collectionKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  var done = assert.async();
  adapter.findAll(RESTModel, records).then(function(resolve) {
    assert.ok(resolve === records, "findAll() resolved with records");
    done();
  });
});

QUnit.test("findQuery() resolves with records", function(assert) {
  assert.expect(1);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      records = Ember.RecordArray.create();

  RESTModel.collectionKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  var done = assert.async();
  adapter.findQuery(RESTModel, records, {}).then(function(resolve) {
    assert.ok(resolve === records, "findQuery() resolved with records");
    done();
  });
});

QUnit.test("createRecord() resolves with record", function(assert) {
  assert.expect(1);

  var data = {id: 1, name: 'Erik'},
      record = RESTModel.create();

  RESTModel.rootKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };
  var done = assert.async();
  adapter.createRecord(record).then(function(resolve) {
    assert.ok(resolve === record, "createRecord() resolved with record");
    done();
  });
});

QUnit.test("saveRecord() resolves with record", function(assert) {
  assert.expect(1);

  var data = {id: 1, name: 'Erik'},
      record = RESTModel.create({name: 'Ray'});

  RESTModel.rootKey = undefined;
  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };
  var done = assert.async();
  adapter.saveRecord(record).then(function(resolve) {
    assert.ok(resolve === record, "saveRecord() resolved with record");
    done();
  });
});

QUnit.test("buildURL() creates url from model's url, id, and url suffix", function(assert) {
  assert.expect(3);
  RESTModel.url = "/posts";

  var url = adapter.buildURL(RESTModel, null);
  assert.equal(url, RESTModel.url);

  url = adapter.buildURL(RESTModel, "123");
  assert.equal(url, "/posts/123" );

  RESTModel.urlSuffix = ".json";
  url = adapter.buildURL(RESTModel, "123");
  assert.equal(url, "/posts/123.json" );
});

QUnit.test('_handleRejections() will resolve empty successful DELETEs', function(assert) {
  assert.expect(1);
  var resolve = function(data) {
    assert.ok(data === null, "resolved with null");
  };
  Ember.run(function() {
    adapter._handleRejections("DELETE", {status: 200}, resolve, Ember.$.noop);
  });
});

QUnit.test('_handleRejections() will reject empty responses for other verbs', function(assert) {
  assert.expect(1);
  var reject = function(data) {
    assert.ok(data.status === 200, "rejected with 200 status");
  };
  Ember.run(function() {
    adapter._handleRejections("PUT", {status: 200}, Ember.$.noop, reject);
  });
});

QUnit.test('_handleRejections() will reject DELETEs with unsuccessful status codes', function(assert) {
  assert.expect(1);
  var reject = function(data) {
    assert.ok(data.status === 403, "rejected with 403 status");
  };
  Ember.run(function() {
    adapter._handleRejections("DELETE", {status: 403}, Ember.$.noop, reject);
  });
});
