var execSync = require('execSync').exec;

function gitSha(){
  var tags = execSync('git describe --tags'),
      sha  = execSync('git log -n 1 --format="%h (%ci)"'),
      banner = '';

  if (!tags.code) {
    banner = banner + "// " + tags.stdout;
  }

  if (!sha.code) {
    banner = banner + "// " + sha.stdout;
  }

  return banner;
}

module.exports = function(grunt){
  grunt.registerMultiTask('banner', 'Append a banner to production', function(){
    var options = this.options(),
        license = grunt.file.read(options.license),
        gitInfo = gitSha(),
        code = grunt.file.read(this.file.src);

    grunt.file.write(this.file.src, [license, gitInfo, code].join("\n"));
  });
};
