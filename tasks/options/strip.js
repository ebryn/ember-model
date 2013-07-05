module.exports = {
  production : {
    src : 'dist/ember-model.prod.js',
    options : {
      inline: true,
      nodes : ['Ember.assert']
    }
  }
};
