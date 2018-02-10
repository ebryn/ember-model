var Model, container;

function ajaxSuccess(data) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    resolve(data);
  });
}

QUnit.module("Ember.RecordArray", {
  beforeEach: function() {
    Model = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr()
    });
    Model.adapter = Ember.FixtureAdapter.create();
    Model.FIXTURES = [
      {id: 1, name: 'Erik'},
      {id: 2, name: 'Stefan'},
      {id: 3, name: 'Kris'}
    ];
    container = new Ember.Registry().container();
  },
  afterEach: function() { }
});

QUnit.test("load creates records with container when container exists", function(assert) {
  var records = Ember.RecordArray.create({modelClass: Model, container: container});
  Ember.run(records, records.load, Model, Model.FIXTURES);
  records.forEach(function(record){
    assert.ok(record.get('isLoaded'));
    assert.ok(record.get('container'));
  });
});

QUnit.test("when called with findMany, should contain an array of the IDs contained in the RecordArray", function(assert) {
  var records = Ember.run(Model, Model.find, [1,2,3]);

  assert.deepEqual(records.get('_ids'), [1,2,3]);
  assert.equal(records.get('length'), 0);
  assert.ok(!records.get('isLoaded'));
  var done = assert.async();

  records.one('didLoad', function() {
    done();
    assert.equal(records.get('length'), 3);
  });
});

QUnit.test("findAll RecordArray implements reload", function(assert) {
  assert.expect(4);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = Ember.RESTAdapter.create(),
      records, changed;

  RESTModel.url = '/fake/api';
  RESTModel.adapter = adapter;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  assert.equal(records.get('length'), 2);

  data.push({id: 3, name: 'Ray'});
  data[1].name = 'Amos';

  Ember.run(function() {
    records.reload();
  });

  assert.equal(records.get('length'), 3);
  assert.ok(records.get('isLoaded'));
  assert.deepEqual(RESTModel.find(2).toJSON(), {id: 2, name: 'Amos'});

});

QUnit.test("findQuery RecordArray implements reload", function(assert) {
  assert.expect(4);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = Ember.RESTAdapter.create(),
      records, changed;

  RESTModel.url = '/fake/api';
  RESTModel.adapter = adapter;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findQuery({name: 'Erik'});
  });

  assert.equal(records.get('length'), 2);

  data.push({id: 3, name: 'Ray'});
  data[1].name = 'Amos';

  Ember.run(function() {
    records.reload();
  });

  assert.equal(records.get('length'), 3);
  assert.ok(records.get('isLoaded'));
  assert.deepEqual(RESTModel.find(2).toJSON(), {id: 2, name: 'Amos'});

});

QUnit.test("findMany RecordArray implements reload", function(assert) {
  assert.expect(4);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'}
      ],
      RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = Ember.RESTAdapter.create(),
      records, changed;

  RESTModel.url = '/fake/api';
  RESTModel.adapter = adapter;

  adapter.findMany = function(klass, records, ids) {
    return adapter.findAll(klass, records);
  };

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.find([1,2]);
  });

  assert.equal(records.get('length'), 2);

  data[1].name = 'Amos';

  Ember.run(function() {
    records.reload();
  });

  assert.equal(records.get('length'), 2);
  assert.ok(records.get('isLoaded'));
  assert.deepEqual(RESTModel.find(2).toJSON(), {id: 2, name: 'Amos'});

});

QUnit.test("reload handles record removal", function(assert) {
  assert.expect(4);

  var data = [
        {id: 1, name: 'Erik'},
        {id: 2, name: 'Aaron'},
        {id: 3, name: 'Ray'}
      ],
      RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = Ember.RESTAdapter.create(),
      records, changed;

  RESTModel.url = '/fake/api';
  RESTModel.adapter = adapter;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  assert.equal(records.get('length'), 3);

  data.splice(1, 1);

  Ember.run(function() {
    records.reload();
  });

  assert.equal(records.get('length'), 2);
  assert.deepEqual(records.objectAt(0).toJSON(), {id: 1, name: 'Erik'});
  assert.deepEqual(records.objectAt(1).toJSON(), {id: 3, name: 'Ray'});
});

QUnit.test("RecordArray handles already inserted new models being saved", function(assert) {
  assert.expect(3);

  var data = [
        {id: 1, name: 'Erik'}
      ],
      RESTModel = Ember.Model.extend({
        id: Ember.attr(),
        name: Ember.attr()
      }),
      adapter = Ember.RESTAdapter.create(),
      records, changed;

  RESTModel.url = '/fake/api';
  RESTModel.adapter = adapter;

  adapter._ajax = function(url, params, method) {
    return ajaxSuccess(data);
  };

  Ember.run(function() {
    records = RESTModel.findAll();
  });

  assert.equal(records.get('length'), 1);

  var newModel = RESTModel.create();

  records.pushObject(newModel);

  Ember.run(function() {
    newModel.save();
  });

  assert.equal(records.get('length'), 2);
  assert.equal(records.objectAt(1), newModel);
});
