function mustImplement(message) {
  var fn = function() {
    var className = this.constructor.toString();

    throw new Error(message.replace('{{className}}', className));
  };
  fn.isUnimplemented = true;
  return fn;
}

var get = Ember.get;

Ember.Adapter = Ember.Object.extend({
  find: mustImplement('{{className}} must implement find'),
  findQuery: mustImplement('{{className}} must implement findQuery'),
  findMany: mustImplement('{{className}} must implement findMany'),
  findAll: mustImplement('{{className}} must implement findAll'),
  createRecord: mustImplement('{{className}} must implement createRecord'),
  saveRecord: mustImplement('{{className}} must implement saveRecord'),
  deleteRecord: mustImplement('{{className}} must implement deleteRecord'),

  load: function(record, id, data) {
    record.load(id, data);
  }
});

/**
  `Ember.WellBehavedAdapter` provides common implementations of typical adapter
  methods. The behaviour of which, while not explicitly specified, is required
  for the test suite to pass. In its current implementation, it does not define
  all that is required for an adapter to behave as expected.
*/
Ember.WellBehavedAdapter = Ember.Mixin.create({

  didCreateRecord: function(record, data) {
    var rootKey = get(record.constructor, 'rootKey'),
        primaryKey = get(record.constructor, 'primaryKey'),
        dataToLoad = rootKey ? data[rootKey] : data;

    // 1. load the supplied data for the newly created record
    // 2. trigger the `didLoad` event
    record.load(dataToLoad[primaryKey], dataToLoad);

    // 3. trigger the `didCreateRecord` event
    // 4. trigger the `didSaveRecord` event
    record.didCreateRecord();
  }
});
