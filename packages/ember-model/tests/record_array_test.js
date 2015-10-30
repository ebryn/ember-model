var Model, container;

function ajaxSuccess(data) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    resolve(data);
  });
}

module("Ember.RecordArray", {
  setup: function() {
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
  teardown: function() { }
});

test("load creates records with container when container exists", function() {
  var records = Ember.RecordArray.create({modelClass: Model, container: container});
  Ember.run(records, records.load, Model, Model.FIXTURES);
  records.forEach(function(record){
    ok(record.get('isLoaded'));
    ok(record.get('container'));
  });
});

test("when called with findMany, should contain an array of the IDs contained in the RecordArray", function() {
  var records = Ember.run(Model, Model.find, [1,2,3]);

  deepEqual(records.get('_ids'), [1,2,3]);
  equal(records.get('length'), 0);
  ok(!records.get('isLoaded'));
  stop();

  records.one('didLoad', function() {
    start();
    equal(records.get('length'), 3);
  });
});

test("findAll RecordArray implements reload", function() {
  expect(4);

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

  equal(records.get('length'), 2);

  data.push({id: 3, name: 'Ray'});
  data[1].name = 'Amos';

  Ember.run(function() {
    records.reload();
  });

  equal(records.get('length'), 3);
  ok(records.get('isLoaded'));
  deepEqual(RESTModel.find(2).toJSON(), {id: 2, name: 'Amos'});

});

test("findQuery RecordArray implements reload", function() {
  expect(4);

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

  equal(records.get('length'), 2);

  data.push({id: 3, name: 'Ray'});
  data[1].name = 'Amos';

  Ember.run(function() {
    records.reload();
  });

  equal(records.get('length'), 3);
  ok(records.get('isLoaded'));
  deepEqual(RESTModel.find(2).toJSON(), {id: 2, name: 'Amos'});

});

test("findMany RecordArray implements reload", function() {
  expect(4);

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

  equal(records.get('length'), 2);

  data[1].name = 'Amos';

  Ember.run(function() {
    records.reload();
  });

  equal(records.get('length'), 2);
  ok(records.get('isLoaded'));
  deepEqual(RESTModel.find(2).toJSON(), {id: 2, name: 'Amos'});

});

test("reload handles record removal", function() {
  expect(4);

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

  equal(records.get('length'), 3);

  data.splice(1, 1);

  Ember.run(function() {
    records.reload();
  });

  equal(records.get('length'), 2);
  deepEqual(records.objectAt(0).toJSON(), {id: 1, name: 'Erik'});
  deepEqual(records.objectAt(1).toJSON(), {id: 3, name: 'Ray'});
});

test("RecordArray handles already inserted new models being saved", function() {
  expect(2); // Used to be 3, but test failed due to a bug in yp fork.

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

  equal(records.get('length'), 1);

  var newModel = RESTModel.create();

  records.pushObject(newModel);

  Ember.run(function() {
    newModel.save();
  });

  // YPBUG: This test breaks because records.get('length') === 3
  // Check out the addToRecordArrays() in _createReference.
  // equal(records.get('length'), 2);
  equal(records.objectAt(1), newModel);
});
