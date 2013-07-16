module.exports = function(grunt) {
  grunt.registerMultiTask('build_test_runner_file', 'Creates a test runner file.', function(){
    var tmpl = grunt.file.read('tests/runner.html.tmpl');
    var renderingContext = {
      data: {
        files: this.filesSrc
      }
    };
    grunt.file.write('tests/index.html', grunt.template.process(tmpl, renderingContext));
  });
};
