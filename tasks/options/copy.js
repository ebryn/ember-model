module.exports = {
  production: {
    src: 'dist/ember-model.js', 
    dest: 'dist/ember-model.prod.js'
  },
  release: {files : [{
    src: 'dist/ember-model.js', 
    dest: './ember-model.js'
  }, {
    src: 'dist/ember-model-plugins.js', 
    dest: './ember-model-plugins.js'
  }]}
};
