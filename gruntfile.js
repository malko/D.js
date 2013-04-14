module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/* (c) Jonathan Gotti - licence: https://github.com/malko/d.js/LICENCE.txt */\n'
      },
      build: {
        src: 'lib/D.js',
        dest: 'lib/D.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};