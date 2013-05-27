require('ember-model/store');

module("Ember.Store");

test("instantiation", function() {
  ok(new Ember.Store());
});

test("load and find", function() {
  var store = new Ember.Store();
  store.load('article', 1, {title: 'zomg'});

  var result = store.find('article', 1);
  ok(result);
  equal(result.title, 'zomg');
});

test("fork", function() {
  var store = new Ember.Store();
  store.load('article', 1, {title: 'zomg'});

  var fork = store.fork();
  fork.load('article', 1, {title: 'wat'});

  ok(store.versions.article1 < fork.versions.article1);

  equal(store.find('article', 1).title, 'zomg');
  equal( fork.find('article', 1).title, 'wat' );
});

test("merge - store not updated, fork updated", function() {
  var store = new Ember.Store();
  store.load('article', 1, {title: 'zomg'});

  var fork = store.fork();
  fork.load('article', 1, {title: 'wat'});

  var conflicts = store.merge(fork);
  equal(conflicts.length, 0);

  equal(store.find('article', 1).title, 'wat');
});

test("merge - store updated, fork not updated", function() {
  var store = new Ember.Store();
  store.load('article', 1, {title: 'zomg'});

  var fork = store.fork();

  store.load('article', 1, {title: 'ZOMG'});

  var conflicts = store.merge(fork);
  equal(conflicts.length, 0);

  equal(store.find('article', 1).title, 'ZOMG');
});

test("merge - store updated, fork updated", function() {
  var store = new Ember.Store();
  store.load('article', 1, {title: 'zomg'});

  var fork = store.fork();
  fork.load('article', 1, {title: 'wat'});

  store.load('article', 1, {title: 'ZOMG'});

  var conflicts = store.merge(fork);

  equal(conflicts.length, 1);
});

test("async merge", function() {
  var store = new Ember.Store();
  store.load('article', 1, {title: 'zomg'});

  var fork = store.fork();
  fork.load('article', 1, {title: 'wat'});

  store.load('article', 1, {title: 'ZOMG'});

  var conflicts = store.merge(fork);
  equal(conflicts.length, 1);

  // change the store again
  store.load('article', 1, {title: 'trololo'});

  var conflict = conflicts.pop();
  conflict.lastWriteWins();

  equal(store.find('article1').title, 'trololo');
});