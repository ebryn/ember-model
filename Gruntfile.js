function config(name) {
  return require('./tasks/options/' + name);
}

module.exports = function(grunt) {
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('bower.json'),

    neuter: config('neuter'),
    jshint: config('jshint'),
    uglify: config('uglify'),
    release: config('release'),
    qunit: config('qunit'),
    build_test_runner_file: {
      all: ['packages/ember-model/tests/**/*_test.js']
    },
    banner: config('banner'),
    strip: config('strip'),
    clean: config('clean')
  });

  // Load the node modules that provide tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // rename relase so we can apply our own behavior, then call the npm grunt-release
  grunt.task.renameTask('release', '_release');

  // load local tasks
  grunt.task.loadTasks('./tasks');   
  
  grunt.registerTask('build', ['jshint', 'neuter', 'build-prod']);
  grunt.registerTask('test', ['jshint', 'neuter', 'build_test_runner_file', 'qunit', 'clean:test']);
  grunt.registerTask('default', ['build']);

};