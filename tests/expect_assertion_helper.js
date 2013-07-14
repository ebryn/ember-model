//Taken from github.com/emberjs/ember-dev
  function expectAssertion(fn, expectedMessage) {
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
        ok(false, "Expected Ember.assert: '" + expectedMessage + "', but no assertions where run");
      } else if (arity === 2) {

        if (expectedMessage) {
          if (expectedMessage instanceof RegExp) {
            ok(expectedMessage.test(actualMessage), "Expected Ember.assert: '" + expectedMessage + "', but got '" + actualMessage + "'");
          }else{
            equal(actualMessage, expectedMessage, "Expected Ember.assert: '" + expectedMessage + "', but got '" + actualMessage + "'");
          }
        } else {
          ok(!actualTest);
        }
      } else if (arity === 1) {
        ok(!actualTest);
      } else {
        ok(false, 'Ember.assert was called without the assertion');
      }

    } finally {
      Ember.assert = originalAssert;
    }
  }
  window.expectAssertion = expectAssertion;