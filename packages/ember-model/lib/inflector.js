var capitalize = Ember.String.capitalize;

var inflector = Ember.Model.Inflector = {
  singulars:  {},
  plurals:    {},

  irregular: function(singular, plural) {
    this.singulars[plural]              = singular;
    this.singulars[capitalize(plural)]  = capitalize(singular);
    this.plurals[singular]              = plural;
    this.plurals[capitalize(singular)]  = capitalize(plural);
  },
  uncountable: function(word) {
    this.irregular(word, word);
  },

  beginningAndLast: function (string) {
    // regex splits at underscore or capital or "ID"
    var words   = string.split(/(ID)|(?=[A-Z][a-z])|(_)/),
    last        = words.pop();
    return [words.join(''), last];
  },

  lookup: function(string, table, notFoundFunc) {
    var lookup,
      beginningAndLast  = this.beginningAndLast(string),
      beginning         = beginningAndLast[0],
      last              = beginningAndLast[1];
    if ((lookup = table[last])) {
      return beginning + lookup;
    }
  },

  pluralize: function(string) {
    return this.lookup(string, this.plurals) || "" + string + "s";
  },
  singularize: function(string) {
    return this.lookup(string, this.singulars) ||
      ("" + string).replace(/s$/, '');
  }
};


if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.String) {
  String.prototype.pluralize = function() {
    return inflector.pluralize(this);
  };
  String.prototype.singularize = function() {
    return inflector.singularize(this);
  };

}

