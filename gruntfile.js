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
		},
		mochacli: {
			options: {
				require: ['chai'],
				reporter: 'spec',
				timeout: 300
			},
			src: { options: {files: 'tests/d-src*.js'}},
			min: { options: {files: 'tests/d-min*.js'}}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-mocha-cli');

	// Default task(s).
	grunt.registerTask('default', ['uglify']);
	grunt.registerTask('test', ['mochacli']);

};