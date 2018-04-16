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
    testem: config('testem'),
    build_test_runner_file: {
      all: ['packages/ember-model/tests/**/*_test.js']
    },
    banner: config('banner'),
    clean: config('clean'),
    copy:  config('copy'),
    'ember-s3': config('ember-s3')
  });

  // Load the node modules that provide tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // rename relase so we can apply our own behavior, then call the npm grunt-release
  grunt.task.renameTask('release', 'publish');

  // load local tasks
  grunt.task.loadTasks('./tasks');

  grunt.registerTask('dev_build', ['jshint:development', 'neuter', 'build_test_runner_file']);
  grunt.registerTask('develop', ['dev_build', 'testem:run:default']);
  grunt.registerTask('build', ['jshint:all', 'neuter', 'production']);

  grunt.registerTask('production', ['copy:production', 'uglify:production', 'banner']);
  grunt.registerTask('test', ['jshint:all', 'neuter', 'build_test_runner_file', 'testem:ci:default', 'clean:test']);
  grunt.registerTask('default', ['build']);

};
