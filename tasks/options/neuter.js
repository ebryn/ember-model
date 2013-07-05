module.exports = {
  options: {
    filepathTransform: function(filepath) {
      filepath.replace('ember-model', 'ember-model/lib');
      return 'packages/' + filepath.replace('ember-model', 'ember-model/lib');
    }
  },
  'dist/ember-model.js': 'packages/ember-model/lib/main.js'
};
