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
//-
//- promisesAplusTests(exports, function (err) {
	//- err && console.error('Error',err);
  //- // All done; output is in the console. Or check `err` for number of failures.
//- });
