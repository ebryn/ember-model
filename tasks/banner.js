var exec = require('child_process').exec;

module.exports = function(grunt){
  grunt.registerMultiTask('banner', 'Append a banner to production', function(){
    var done = this.async(),
        task = this;
    exec('git describe --tags', 
      function(tags_error, tags_stdout, tags_stderr) {
        var tags =  tags_stdout;
        exec('git log -n 1 --format="%h (%ci)"', 
          function(sha_error, sha_stdout, sha_stderr) {
            var sha  = sha_stdout,
                banner = '';

            if (!tags_error) {
              banner = banner + "// " + tags;
            }

            if (!sha_error) {
              banner = banner + "// " + sha;
            }

            var options = task.options(),
                license = grunt.file.read(options.license),
                gitInfo = banner,
                code = grunt.file.read(task.file.src);

            grunt.file.write(task.file.src, [license, gitInfo, code].join("\n"));
            done();
          });
      });
  });
};
