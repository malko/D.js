module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/* (c) Jonathan Gotti - licence: https://github.com/malko/d.js/LICENCE.txt @version 0.0.0*/\n'
			},
			build: {
				src: 'lib/D.js',
				dest: 'lib/D.min.js'
			}
		},
		version: {
			options: {
				prefix:'@version\\s*'
			},
			defaults: {
				src:['lib/D.js', 'lib/D.min.js']
			}
		},
		mochacli: {
			options: {
				require: ['chai'],
				reporter: 'spec',
				timeout: 300
			},
			src: { options: {files: 'tests/d-src*.js'}},
			min: { options: {files: 'tests/d-min*.js'}},
			cov: { options: {files: 'tests/d-cov*.js'}}
		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-mocha-cli');
	grunt.loadNpmTasks('grunt-version');

	// Default task(s).
	grunt.registerTask('default', ['build']);
	grunt.registerTask('test', ['mochacli:src','mochacli:min']);
	grunt.registerTask('build', ['uglify','version','test']);
	grunt.registerTask('build-patch', ['uglify','version::patch','test']);
	grunt.registerTask('build-minor', ['uglify','version::minor','test']);

};
