Ember.Validator = Ember.Object.extend({
  target:    null,
  targetKey: null,

  error: function() {
    if (!this.get('isValid')) {
      return this.get('targetKey') + ' ' + this.get('message');
    }
  }.property('isValid', 'targetKey', 'message'),

  message: 'is invalid.',

  isInvalid: Ember.computed.not('isValid'),

  isValid: function() {
    var content = this.get('content');
    return content && (content.length > 0);
  }.property('content'),

  init: function() { this.addPropertyObserver(); },

  addPropertyObserver: function() {
    var target = this.get('target');
    var targetKey = this.get('targetKey');
    if (target && targetKey) {
      target.addObserver(targetKey, this, 'validate');
    }
  }.observes('target', 'targetKey'),

  validate: function() {
    this.set('content', this.get('target').get(this.get('targetKey')));
  }
});

