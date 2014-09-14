/*global describe, it*/
/*jshint -W024, -W101*/
"use strict";
var expect = require('chai').expect;

var resolvedCount=0, rejectedCount=0;
function resetCounters(){ resolvedCount=0; rejectedCount=0; }
function resolve(){ resolvedCount++;}
function reject(){ rejectedCount++;}
function isPromise(p){ return ('then' in p) && (p.then instanceof Function); }
function getTime(){ return (new Date()).getTime(); }
function plus(a){ return a+a;}

module.exports = function(D){

describe('D methods', function(){
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


	describe('D.wait',function(){
		var start, p;
		this.timeout(300);
		it('should return a promise', function(){
			start = getTime();
			p = D.wait(150).success(function(){ return getTime(); }).rethrow();
			expect(isPromise(p)).to.be.true;
		});

		it('which should not be resolved before the time passed', function(done){
			setTimeout(function(){
				expect(p.isPending()).to.be.true;
				done();
			},50);
		});

		it('and should be resolved after the time passed', function(done){
			setTimeout(function(){
				expect(p.isPending()).to.be.false;
				expect(p.getStatus()).to.equal(1);
				p.success(function(end){
					expect(end - start).to.be.at.least(149);
				}).rethrow();
				done();
			},151);
		});

	});


	describe('D.delay',function(){
		var start, p, endPromise;
		this.timeout(300);
		it('should return a promise', function(){
			start = getTime();
			p = D.delay(function(){ return 'done';}, 150);
			expect(isPromise(p)).to.be.true;
			endPromise = p.success(function(){ return getTime(); }).rethrow();
		});

		it('which should not be resolved before the time passed', function(done){
			setTimeout(function(){
				expect(p.isPending()).to.be.true;
				done();
			},100);
		});

		it('and should be resolved after the delay is passed with fn return value', function(done){
			setTimeout(function(){
				expect(p.isPending()).to.be.false;
				expect(p.getStatus()).to.equal(1);
				p.success(function(res){
					expect(res).to.equal('done');
				}).rethrow();
				endPromise.success(function(end){
					expect(end - start).to.be.at.least(149);
				}).rethrow();
				done();
			},151);
		});

		it('or should be resolved after the delay is passed with fn as a direct value', function(done){
			var p = D.delay('ok',100);
			setTimeout(function(){
				expect(p.isPending()).to.be.true;
			},50);
			setTimeout(function(){
				expect(p.isPending()).to.be.false;
				done();
			},110);
			p.then(function(res){
				expect(res).to.eql('ok');
			});
		});
	});


	describe('D.promisify',function(){
		it('if passed a promise should return the same promise object', function(){
			var d = D(), p = d.promise;
			expect(D.promisify(p)).to.equal(p);
		});

		it('should return a promise of passed value if not a promise', function(done){
			var p = D.promisify('ok');
			expect(isPromise(p)).to.be.true;
			p.success(function(res){
				expect(res).to.equal('ok');
				done();
			}).rethrow();
		});
	});


	describe('D.nodeCapsule',function(){

		var nodeStyleFn = function(){
			var args = [].slice.apply(arguments), cb = args.pop();
			if( args[0] === false){
				args = ['error'];
			}else{
				args.splice(0,0,undefined);
			}
			cb.apply(undefined, args);
		};
		var nodeCapsuled = D.nodeCapsule(nodeStyleFn);

		it('should transform a typical node async function to return a promise', function(){
			expect(isPromise(nodeCapsuled())).to.be.true;
		});

		it('returned promised should resolve with callback single parameter as fulfillment value when there is only one parameter',function(done){
			nodeCapsuled(1).success(function(v){
				expect(v).to.equal(1);
				done();
			}).rethrow();
		});

		it('returned promised should resolve with callback list of parameters as fulfillment value when multiple parameters',function(done){
			nodeCapsuled(1,2,3).success(function(v){
				expect(v).to.eql([1,2,3]);
				done();
			}).rethrow();
		});

		it('returned promise should be rejected with given error parameter as the reason',function(done){
			nodeCapsuled(false,1,2,3).error(function(reason){
				expect(reason).to.be.equal('error');
				done();
			});
		});
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
				D.nextTick(function(){
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
				D.nextTick(function(){
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
				D.nextTick(function(){
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
						expect(res).to.eql([p1,p2,p3]);
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
				D.nextTick(function(){
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

				D.nextTick(function(){
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

					D.nextTick(function(){
						p1.reject().promise.then(resolve,reject);
						p2.resolve().promise.then(resolve,reject);
						p3.reject().promise.then(resolve,reject);
					});
			});
		});

	});


	describe('D.sequence',function(){

		it('should accept a single array of function as parameter', function(done){
			D.sequence([function(){ return 1;},plus,plus])
				.then(function(res){
					expect(res).to.eql(4);
					done();
				})
				.rethrow()
			;
		});

		it('should accept a single array of function as parameter', function(done){
			D.sequence([function(){ return 1;},plus,plus])
				.then(function(res){
					expect(res).to.eql(4);
					done();
				})
				.rethrow()
			;
		});

		it('should accept a list of function as parameters', function(done){
			D.sequence(function(){ return 1;},plus,plus)
				.then(function(res){
					expect(res).to.eql(4);
					done();
				})
				.rethrow()
			;
		});

		it('should resolved if no arguments are passed', function(done){
			D.sequence()
				.then(function(){
					done();
				})
				.rethrow()
			;
		});

		it('should also accept values or promises instead of functions', function(done){
			D.sequence(D.resolved(1), plus, plus)
				.then(function(res){
					expect(res).to.eql(4);
					D.sequence(1, plus, plus, plus)
						.then(function(res){
							expect(res).to.eql(8);
							done();
						})
						.rethrow()
					;
				})
				.rethrow()
			;
		});

		it('should be rejected if an error is thrown by one of the given function',function(done){
			D.sequence(function(){ return 1;}, plus, function(){ throw 'aie';}, plus)
				.then(null, function(err){
					expect(err).to.eql("aie");
					done();
				})
				.rethrow()
			;
		});

		it('should execute the sequence in order and pass result to following function',function(done){
			D.sequence(
					function(){ return 1;}
					, function(res){
						expect(res).to.eql(1);
						return 1;
					}
					, D.delay(2,50)
					, function(res){
						expect(res).to.eql(2);
						return 3;
					}
					, function(res){
						expect(res).to.eql(3);
						return 4;
					}
				)
				.then(function(res){
					expect(res).to.eql(4);
					done();
				})
				.rethrow()
			;
		});

	});
});


describe('Promises',function(){

	describe('promise.success',function(){

		it('should be resolved with fulfillment value',function(done){
			var d = D();
			d.resolve('ok');
			d.promise.success(function(v){
				expect(v).to.be.equal('ok');
				done();
			});
		});

		it('should return a new promise',function(done){
			var d = D();
			d.resolve('ok');
			var p = d.promise.success(function(){
				expect(p).to.be.not.equal(d.promise);
				done();
			}).rethrow();
		});
	});


	describe('promise.error',function(){

		it('should have an alias method otherwise',function(){
			var p = D().promise;
			expect(p).to.have.property('otherwise');
			expect(p.otherwise).to.equal(p.error);
		});

		it('should be rejected with given reason',function(done){
			var d = D();
			d.reject('error');
			d.promise.error(function(v){
				expect(v).to.be.equal('error');
				done();
			});
		});

		it('should return a new promise',function(done){
			var d = D();
			d.reject('ok');
			var p = d.promise.error(function(){
				expect(p).to.be.not.equal(d.promise);
				done();
			}).rethrow();
		});
	});


	describe('promise.ensure',function(){

		var p1 = D.fulfilled(1), p2 = D.rejected('error');
		it('should be called when promise is resolved',function(done){
			p1.ensure(done);
		});

		it('should be called when promise is rejected',function(done){
			p2.ensure(done);
		});

		it('should return the same promise untouched',function(done){
			var p = D.resolved('ok');
			var p2 = p.ensure(function(){
				p.tset = 1;
				expect(p).to.be.equal(p2);
				done();
			});
		});

		it('should not change the resolution value',function(done){
			D.resolved('ok')
				.ensure(function(){return 'nok';})
				.success(function(v){
					expect(v).to.be.eql('ok');
					done();
				})
			;
		});

		it('should not change the rejection reason',function(done){
			D.rejected('error')
				.ensure(function(){return 'nok';})
				.error(function(v){
					expect(v).to.be.eql('error');
					done();
				})
			;
		});
	});


	describe('promise.apply',function(){

		it('should have an alias method spread',function(){
			var p = D().promise;
			expect(p).to.have.property('spread');
			expect(p.spread).to.equal(p.apply);
		});

		it('should call onFulfill callback with list of parameters instead of an array as single parameter if fulfilled with an array', function(done){
			D.fulfilled([1,2,3]).apply(function(a,b,c){
				expect(a).to.be.equal(1);
				expect(b).to.be.equal(2);
				expect(c).to.be.equal(3);
				done();
			}).rethrow(done);
		});

		it('should call onFulfill callback with a single parameter if fulfilled value is not an array', function(done){
			D.fulfilled(1).apply(function(a){
				expect(a).to.be.equal(1);
				done();
			}).rethrow(done);
		});
	});


	describe('promise.rethrow',function(){

		it("should rethrow the error even if onRejected callback doesn't throw an error",function(done){
			D.rejected('error')
				.rethrow(function(){
					return 1;
				})
				.error(function(e){
					expect(e).to.be.equal('error');
					done();
				})
			;
		});

		it('without any parameter should rethrow the error to the ouside world at nextick (untestable)');
	});


	describe('promise.nodify',function(){

		it('should call onFulfilled with empty first parameter (error) and other values as following parameters like apply',function(done){
			D.resolved([1,2,3]).nodify(function(err,a,b,c){
				expect(err).to.be.undefined;
				expect(a).to.be.equal(1);
				expect(b).to.be.equal(2);
				expect(c).to.be.equal(3);
				done();
			}).rethrow(done);
		});

		it('should call onFulfilled with empty first parameter (error) and other single value as second parameter like apply',function(done){
			D.resolved(4).nodify(function(err,a){
				expect(err).to.be.undefined;
				expect(a).to.be.equal(4);
				done();
			}).rethrow(done);
		});

		it('should call onRejected with the reason as first error parameter',function(done){
			D.rejected('error').nodify(function(err){
				expect(err).to.be.equal('error');
				expect(arguments.length).to.be.equal(1);
				done();
			}).rethrow(done);
		});

	});


	describe('promise.isPending',function(){

		var d1 = D(), d2 = D();
		it('should return true when promise is pending',function(){
			expect(d1.promise.isPending()).to.be.true;
			expect(d2.promise.isPending()).to.be.true;
		});

		it('should return false when promise is resolved',function(done){
			d1.resolve('ok').promise.success(function(){
				expect(d1.promise.isPending()).to.be.false;
				done();
			});
		});

		it('should return false when promise is rejected',function(done){
			d2.reject('nok').promise.error(function(){
				expect(d2.promise.isPending()).to.be.false;
				done();
			});
		});
	});


	describe('promise.getStatus',function(){

		var d1 = D(), d2 = D();
		it('should return 0 when promise is pending',function(){
			expect(d1.promise.getStatus()).to.be.equal(0);
			expect(d2.promise.getStatus()).to.be.equal(0);
		});

		it('should return 1 when promise is resolved',function(done){
			d1.resolve('ok').promise.success(function(){
				expect(d1.promise.getStatus()).to.be.equal(1);
				done();
			});
		});

		it('should return -1 when promise is rejected',function(done){
			d2.reject('nok').promise.error(function(){
				expect(d2.promise.getStatus()).to.be.equal(-1);
				done();
			});
		});
	});
});

};
