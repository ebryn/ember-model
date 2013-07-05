module.exports = function(grunt){
  grunt.registerTask('release', 'tag a new release', function(type){
    type = type || 'patch';

    grunt.task.run('build');
    grunt.file.copy('dist/ember-model.js', 'ember-model.js');

    grunt.task.run('_release:'+type);
  });
};
