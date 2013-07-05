module.exports = {
  options: {
    nospawn: true,
  },
  code: {
    files: ['packages/ember-model/lib/**/*.js'],
    tasks: ['jshint', 'neuter'],
  },
  test: {
    files: ['packages/ember-model/tests/**/*.js'],
    tasks: ['jshint', 'build_test_runner_file'],
  }
};
