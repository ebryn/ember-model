require('validator');

Ember.Validatable = Ember.Mixin.create({
  _validations: function() {
    var _this = this;
    return this.constructor.validators.map(function(item) {
      return item.validator.create({target: _this, targetKey: item.targetKey});
    });
  }.property(),

  didDefineProperty: function(proto, key, value) {
    this._super();

    if (proto.get('isInstance')) { proto = proto.constructor; }

    if (/Validators?$/.test(key)) {
      var targetKey = key.replace(/Validators?$/, '');
      var validators = proto.validators || [];

      if (/Validator$/.test(key)) {
        validators.pushObject({targetKey: targetKey, validator: value});
      }
      if (/Validators$/.test(key)) {
        value.each(function(item) {
          validators.pushObject({targetKey: targetKey, validator: item});
        });
      }

      proto.validators = validators;
    }

  },

  errors: function() {
    return this.get('_validations').filterProperty('isInvalid').mapProperty('error');
  }.property('_validations.@each.isInvalid', '_validations.@each.error').readOnly(),

  isValid: function() {
    return this.get('_validations').filterProperty('isValid').get('length') > 0;
  }.property('_validations.@each.isValid'),

  isInvalid: Ember.computed.not('isValid')
});
