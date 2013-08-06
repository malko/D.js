/*global describe, it*/
var expect = require('chai').expect;

var resolvedCount=0, rejectedCount=0;
function resetCounters(){ resolvedCount=0; rejectedCount=0; }
function resolve(){ resolvedCount++;}
function reject(){ rejectedCount++;}
function isPromise(p){ return ('then' in p) && (p.then instanceof Function); }


module.exports = function(D){
	describe('D.rejected', function(){

		it('should return a promise which have to be rejected async', function(done){
			var res = D.rejected('test'),async=false;
			expect(res).to.have.property('then');
			expect(res.isPending()).to.be.true;
			res.then(null, function(){
				expect(async).to.be.true;
				done();
			}).rethrow();
			async=true;
		});

		it('which should be rejected with given reason', function(done){
			var res = D.rejected('test');
			res.then(null, function(reason){
				expect(reason).to.equal("test");
				done();
			}).rethrow();
		});
	});


	describe('D.fulfilled', function(){

		it('should have an alias D.resolve method',function(){
			expect(D.fulfilled).to.eql(D.resolved);
		});

		it('should return a promise which have to be fulfilled async', function(done){
			var res = D.fulfilled('test'),async=false;
			expect(isPromise(res)).to.be.true;
			expect(res.isPending()).to.be.true;
			res.then(function(res){
				expect(async).to.be.true;
				expect(res).to.equal("test");
				done();
			}).rethrow();
			async=true;
		});

		it('which should be fulfilled with given value', function(done){
			var res = D.fulfilled('test');
			res.then(function(value){
				expect(value).to.equal("test");
				done();
			}).rethrow();
		});
	});


	describe('D.wait',function(){
		it('should return a promise');

		it('should not be resolved before the time passed');
	});


	describe('D.delay',function(){
		it('should return a promise');

		it('which should resolve with value returned by fn');

		it('should resolve after the requested delay is passed');
	});


	describe('D.promisify',function(){
		it('if passed a promise should return it untouched');
		it('should return a promise of passed value if not a promise');
	});


	describe('D.nodeCapsule',function(){
		//@todo describe and test this method
	});


	describe('D.all',function(){

		describe('Parameters passing', function(){

			it('should accept a single array of promise as parameter', function(done){
				D.all([D.fulfilled(1), D.fulfilled(2), D.fulfilled(3)])
					.success(function(res){
						expect(res).to.eql([1, 2, 3]);
						done();
					})
					.rethrow()
				;
			});

			it('should accept each promise as parameters', function(done){
				D.all(D.fulfilled(1), D.fulfilled(2), D.fulfilled(3))
					.success(function(res){
						expect(res).to.eql([1, 2, 3]);
						done();
					})
					.rethrow()
				;
			});

			it('should accept a list with a single promise first parameter', function(done){
				D.all([D.fulfilled(1)])
					.success(function(res){
						expect(res).to.eql([1]);
						done();
					})
					.rethrow()
				;
			});

			it('should accept a single promise first parameter', function(done){
				D.all(D.fulfilled(1))
					.success(function(res){
						expect(res).to.eql([1]);
						done();
					})
					.rethrow()
				;
			});

			it('should resolve with an empty list if called without any parameter', function(done){
				D.all()
					.success(function(res){
						expect(res).to.eql([]);
						done();
					})
					.rethrow()
				;
			});

			it('should consider non promise parameters as fullfilled promises', function(done){
				D.all(1,2,D.fulfilled(3))
					.success(function(res){
						expect(res).to.eql([1,2,3]);
						done();
					})
					.rethrow()
				;
			});
		});


		describe("Fulfillment condition and promised resolution",function(){

			it('should be resolved when all promised are resolved',function(done){
				var p1 = D(), p2=D(), p3=D();
				resetCounters();
				D.all(p1.promise, p2.promise, p3.promise)
					.then(function(){
						expect(resolvedCount).to.equal(3);
						expect(rejectedCount).to.equal(0);
						done();
					}
				).rethrow();
				process.nextTick(function(){
					p1.resolve().promise.then(resolve,reject);
					p2.resolve().promise.then(resolve,reject);
					p3.resolve().promise.then(resolve,reject);
				});
			});

			it('should send all promised resolved value as list to the onFullfilled callback',function(done){
				resetCounters();
				var p1 = D.fulfilled(1)
					, p2 = D.fulfilled(2)
					, p3 = D.fulfilled(3)
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
				;
			});
		});


		describe("Rejection condition and rejection reason",function(){

			it('should be rejected when any promise is rejected',function(done){
				var p1 = D(), p2=D(), p3=D();
				resetCounters();
				D.all(p1.promise, p2.promise, p3.promise).then(null,function(){
					expect(resolvedCount).to.equal(2);
					expect(rejectedCount).to.equal(1);
					done();
				}).rethrow();
				process.nextTick(function(){
					p1.resolve().promise.then(resolve,reject);
					p2.reject().promise.then(reject,reject);
					p3.resolve().promise.then(resolve,reject);
				});
			});

			it('should be rejected after first rejection and rejected with that reason even if all promised are not resolved',function(done){
				var p1 = D(), p2=D(), p3=D();
				D.all(p1.promise, p2.promise, p3.promise).then(null,function(reason){
					expect(reason).to.equal("reject 2");
					done();
				}).rethrow();
				process.nextTick(function(){
					p2.reject("reject 2");
					p1.reject("reject 1");
				});
			});
		});

	});


	describe('D.resolveAll',function(){

		describe('Parameters passing', function(){

			it('should accept a single array of promise as parameter', function(done){
				var p1 = D.fulfilled(1), p2 = D.fulfilled(2), p3 = D.fulfilled(3);
				D.resolveAll([p1,p2,p3])
					.success(function(res){
						for( var i = 0; i < 3; i++ ){
							expect(isPromise(res[i])).to.be.true;
						}
						expect(res).to.eql([p1,p2,p3])
						done();
					})
					.rethrow()
				;
			});

			it('should accept each promise as parameters', function(done){
				var p1 = D.fulfilled(1), p2 = D.fulfilled(2), p3 = D.fulfilled(3);
				D.resolveAll(p1,p2,p3)
					.success(function(res){
						expect(res).to.eql([p1,p2,p3]);
						done();
					})
					.rethrow()
				;
			});

			it('should accept a list with a single promise first parameter', function(done){
				var p = D.fulfilled(1);
				D.resolveAll([p])
					.success(function(res){
						expect(isPromise(res[0])).to.be.true;
						expect(res).to.eql([p]);
						done();
					})
					.rethrow()
				;
			});

			it('should accept a single promise first parameter', function(done){
				var p = D.fulfilled(1);
				D.resolveAll(p)
					.success(function(res){
						expect(isPromise(res[0])).to.be.true;
						expect(res).to.eql([p]);
						done();
					})
					.rethrow()
				;
			});

			it('should resolve with an empty list if called without any parameter', function(done){
				D.resolveAll()
					.success(function(res){
						expect(res).to.eql([]);
						done();
					})
					.rethrow()
				;
			});

			it('should consider non promise parameters as fullfilled promises', function(done){
				D.resolveAll(1,2,D.fulfilled(3))
					.success(function(res){
						expect(isPromise(res[0])).to.be.true;
						expect(res[0].valueOf()).to.equal(1);
						expect(isPromise(res[1])).to.be.true;
						expect(res[1].valueOf()).to.equal(2);
						expect(isPromise(res[2])).to.be.true;
						expect(res[2].valueOf()).to.equal(3);
						done();
					})
					.rethrow()
				;
			});
		});


		describe("Fulfillment condition and promised resolution",function(){
			it('should be resolved when all promised are resolved',function(done){
				var p1 = D(), p2=D(), p3=D();
				resetCounters();
				D.resolveAll(p1.promise, p2.promise, p3.promise)
					.then(function(){
						expect(resolvedCount).to.equal(3);
						expect(rejectedCount).to.equal(0);
						done();
					}
				).rethrow();
				process.nextTick(function(){
					p1.resolve().promise.then(resolve,reject);
					p2.resolve().promise.then(resolve,reject);
					p3.resolve().promise.then(resolve,reject);
				});
			});

			it('should send all promised resolved as list of promised to onFullfilled callback when all promises are fulfilled',function(done){
				resetCounters();
				var p1 = D.fulfilled(1)
					, p2 = D.fulfilled(2)
					, p3 = D.fulfilled(3)
				;
				p1.then(resolve,reject);
				p2.then(resolve,reject);
				p3.then(resolve,reject);

				D.resolveAll([p1,p2,p3])
					.success(function(ps){
						expect(resolvedCount).to.equal(3);
						expect(rejectedCount).to.equal(0);
						expect(ps)
							.to.be.an('Array')
							.to.eql([p1,p2,p3])
						;
						done();
					})
					.rethrow()
				;
			});
		});


		describe("Rejection condition and rejection reason",function(){
			it('should not be rejected when a promise is rejected',function(done){
				var p1 = D(), p2=D(), p3=D();
				resetCounters();
				D.resolveAll(p1.promise, p2.promise, p3.promise).success(function(res){
					expect(isPromise(res[0])).to.be.true;
					expect(res[0].valueOf()).to.equal(p1.promise);
					expect(isPromise(res[1])).to.be.true;
					expect(res[1].valueOf()).to.equal(p2.promise);
					expect(isPromise(res[2])).to.be.true;
					expect(res[2].valueOf()).to.equal(p3.promise);

					expect(resolvedCount).to.equal(1);
					expect(rejectedCount).to.equal(2);
					done();
				})
				.rethrow();

				process.nextTick(function(){
					p1.reject().promise.then(resolve,reject);
					p2.resolve().promise.then(resolve,reject);
					p3.reject().promise.then(resolve,reject);
				});
			});

			it('should send all promised resolved as list of promised to onFullfilled callback when all promises are not pending any more',function(done){
					var p1 = D(), p2=D(), p3=D();
					D.resolveAll(p1.promise, p2.promise, p3.promise).success(function(res){
						expect(res[0].getStatus()).to.equal(-1);
						expect(res[1].getStatus()).to.equal(1);
						expect(res[2].getStatus()).to.equal(-1);

						done();
					})
						.rethrow();

					process.nextTick(function(){
						p1.reject().promise.then(resolve,reject);
						p2.resolve().promise.then(resolve,reject);
						p3.reject().promise.then(resolve,reject);
					});
			});
		});

	});
};

// tester promisify avec differentes entrées
// tester D.all
// ajouter une methode complete qui prendrait une fonction nodeStyled-Dide.unix.full.screen.enabled=true