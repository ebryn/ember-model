var attr = Ember.attr;

module("Dirty tracking");

test("when no properties have changed on a model, save should noop", function() {
  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      throw "saveRecord shouldn't be called";
    }
  };

  var obj = Model.create({isNew: false});
  ok(!obj.get('isDirty'));

  Ember.run(obj, obj.save);
});

test("when properties have changed on a model, isDirty should be set", function() {
  expect(3);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      ok(true, "saveRecord was called");
    }
  };

  var obj = Model.create({isNew: false});
  ok(!obj.get('isDirty'));

  obj.set('name', 'Jeffrey');
  ok(obj.get('isDirty'));

  Ember.run(obj, obj.save);
});

test("when properties are changed back to the loaded value, isDirty should be false", function() {
  expect(6);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function() {
      ok(true, "saveRecord was called");
    }
  };

  var obj = Model.create({isNew: false, name: 'Erik'});
  ok(!obj.get('isDirty'));
  equal(obj._dirtyAttributes, null, "There shouldn't be any dirty attributes");

  obj.set('name', 'Jeffrey');
  ok(obj.get('isDirty'));
  deepEqual(obj._dirtyAttributes, ["name"], "Name should be dirty");

  obj.set('name', 'Erik');
  ok(!obj.get('isDirty'));
  deepEqual(obj._dirtyAttributes, [], "There shouldn't be any dirty attributes");
});

test("after saving, the model shouldn't be dirty", function() {
  expect(3);

  var Model = Ember.Model.extend({
    name: attr()
  });

  Model.adapter = {
    saveRecord: function(record) {
      ok(true, "saveRecord was called");
      var deferred = Ember.Deferred.create();
      deferred.then(function() {
        record.didSaveRecord();
      });
      deferred.resolve(record);
      return deferred;
  }
  };

  var obj = Model.create({isNew: false});
  obj.set('name', 'Erik');
  ok(obj.get('isDirty'));

  stop();
  Ember.run(function() {
    obj.save().then(function() {
      start();
      ok(!obj.get('isDirty'), "The record is no longer dirty");
    });
  });
});