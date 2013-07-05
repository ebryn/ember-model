module.exports = function(grunt){
  grunt.registerTask('build-prod', function(){
    grunt.file.copy('dist/ember-model.js', 'dist/ember-model.prod.js');
    grunt.task.run('strip:production');
    grunt.task.run('uglify:production');
    grunt.task.run('banner');
  });
};
