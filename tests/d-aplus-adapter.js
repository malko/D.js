var D = require('../lib/D.js')
	,promisesAplusTests = require('promises-aplus-tests')
;
exports.fulfilled = function (value){ return D.resolved(value); };
exports.rejected = function (reason){ return D.rejected(reason); };
exports.pending = function pending(){
	var d=D();
	return {
		promise:d.promise
		,fulfill:d.resolve
		,reject:d.reject
	};
}