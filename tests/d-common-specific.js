var expect = require('chai').expect

module.exports = function(D){
	describe('D.rejected', function(){

		it('should return a promise which have to be rejected async', function(done){
			var res = D.rejected('test');
			expect(res).to.have.property('then');
			expect(res.isPending()).to.be.true;
			res.then(null, function(){done();});
		});
	});

	describe('D.all',function(){
		var resolvedCount=0, rejectedCount=0;
		function reset(){ resolvedCount=0; rejectedCount=0; }
		function resolve(){ resolvedCount++;}
		function reject(){ rejectedCount++;}
		it('should be resolved when all promised are resolved',function(done){
			var p1 = D(), p2=D(), p3=D();
			reset();
			D.all(p1.promise, p2.promise, p3.promise)
				.then(function(){
					expect(resolvedCount).to.equal(3);
					expect(rejectedCount).to.equal(0);
					done();
				}
			).rethrow();
			p1.resolve().promise.then(resolve,reject);
			p2.resolve().promise.then(resolve,reject);
			p3.resolve().promise.then(resolve,reject);
		});
		it('should be rejected when any promise is rejected',function(done){
			var p1 = D(), p2=D(), p3=D();
			reset();
			D.all(p1.promise, p2.promise, p3.promise).then(null,function(){
				expect(resolvedCount).to.equal(2);
				expect(rejectedCount).to.equal(1);
				done();
			}).rethrow();
			p1.resolve().promise.then(resolve,reject);
			p2.reject().promise.then(reject,reject);
			p3.resolve().promise.then(resolve,reject);
		});
		it('should send all promised resolved value as list to the onFullfilled callback',function(done){
			reset();
			var p1 = D.fulfilled(1)
				, p3 = D.fulfilled(3)
				, p2 = D.fulfilled(2)
			;
			p1.then(resolve,reject);
			p2.then(resolve,reject);
			p3.then(resolve,reject);

			D.all([p1,p2,p3])
				.success(function(ps){
					expect(resolvedCount).to.equal(3);
					expect(rejectedCount).to.equal(0);
					expect(ps)
						.to.be.an('Array')
						.to.eql([1,2,3])
					;
					done();
				})
				.rethrow()
		});
		it('should accept a single array of promise as parameter');
		it('should accept each promise as parameters');
		it('should accept a list with a single promise first parameter');
		it('should accept a single promise first parameter');
		it('should be rejected after first rejection and rejected with that reason');

	});
};

// tester promisify avec differentes entrées
// tester D.all
// ajouter une methode complete qui prendrait une fonction nodeStyled