//Taken from github.com/emberjs/ember-dev
  function expectAssertion(assert, fn, expectedMessage) {
    var originalAssert = Ember.assert,
      actualMessage, actualTest,
      arity, sawAssertion;

    var AssertionFailedError = new Error('AssertionFailed');

    try {
      Ember.assert = function(message, test) {
        arity = arguments.length;
        actualMessage = message;
        actualTest = test;

        if (!test) {
          throw AssertionFailedError;
        }
      };

      try {
        fn();
      } catch(error) {
        if (error === AssertionFailedError) {
          sawAssertion = true;
        } else {
          throw error;
        }
      }

      if (!sawAssertion) {
        assert.ok(false, "Expected Ember.assert: '" + expectedMessage + "', but no assertions where run");
      } else if (arity === 2) {

        if (expectedMessage) {
          if (expectedMessage instanceof RegExp) {
            assert.ok(expectedMessage.test(actualMessage), "Expected Ember.assert: '" + expectedMessage + "', but got '" + actualMessage + "'");
          }else{
            assert.equal(actualMessage, expectedMessage, "Expected Ember.assert: '" + expectedMessage + "', but got '" + actualMessage + "'");
          }
        } else {
          assert.ok(!actualTest);
        }
      } else if (arity === 1) {
        assert.ok(!actualTest);
      } else {
        assert.ok(false, 'Ember.assert was called without the assertion');
      }

    } finally {
      Ember.assert = originalAssert;
    }
  }
  window.expectAssertion = expectAssertion;


var Owner = Ember.Object.extend(Ember._RegistryProxyMixin, Ember._ContainerProxyMixin);
window.createOwner = function() {
  var registry = new Ember.Registry();
  var owner = Owner.create({
    __registry__: registry
  });
  var container = registry.container({
    owner: owner
  });
  owner.__container__ = container;
  return owner;
};
