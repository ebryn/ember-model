module.exports = {
  default: {
    src: [
      'packages/ember-model/**/*.js',
      'test_helpers.js',
      'dist/ember-model'
    ],
    options: {
      on_change: 'grunt dev_build',
      test_page: 'tests/index.html',
      reporter: 'tap',
      launch_in_ci: ['Chrome'],
      launch_in_dev: ['Chrome'],
      browser_args: {
        Chrome: {
          all: [
            '--no-default-browser-check',
            '--disable-extensions',
          ],
          ci: [
            // --no-sandbox is needed when running Chrome inside a container
            process.env.TRAVIS ? '--no-sandbox' : null,

            '--disable-gpu',
            '--headless',
            '--remote-debugging-port=0',
            '--window-size=1440,900'
          ].filter(Boolean)
        }
      }
    }
  }
};

