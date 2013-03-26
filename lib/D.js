/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:2, maxerr:50, laxcomma:true, expr:true, white:false, expr:true, latedef:true*/
/*global exports*/
/**
* attempt of a simple defer/promise library for mobile development
* @author Jonathan Gotti for agence-modedemploi.com
* @since 2012-10
* @changelog
*           - 2013-03-21 - browser/node compatible
*                        - new method nodeCapsule
*                        - simpler promixify with full api support
*           - 2013-01-25 - add rethrow method
*                        - nextTick optimisation -> add support for process.nextTick + MessageChannel where available
*           - 2012-12-28 - add apply method to promise
*           - 2012-12-20 - add alwaysAsync parameters and property for default setting
*/
(function(){
	"use strict";

var nextTick;
if( (typeof process !== 'undefined') && process.nextTick ){
	nextTick = process.nextTick;
}else if( typeof MessageChannel !== "undefined" ){
	var ntickChannel = new MessageChannel(),queue=[];
	ntickChannel.port1.onmessage = function(){ queue.length && (queue.shift())(); };
	nextTick = function(cb){
		queue.push(cb);
		ntickChannel.port2.postMessage(0);
	};
}else{
	nextTick = function(cb){ setTimeout(cb,0); };
}
function rethrow(e){ nextTick(function(){ throw e;}); }

	var defer = function (alwaysAsync){
		alwaysAsync || (alwaysAsync = defer.alwaysAsync);
		var status   = 0 // -1 failed | 1 fulfilled
			,pendings = []
			,value
			,promise  = {
				then:function(fulfilled,failed){
					var d = defer();
					pendings.push([
						function(value){
							try{ d.resolve(fulfilled?((typeof fulfilled==='function')?fulfilled.call(null,value):fulfilled):value); }catch(e){ d.reject(e);  }
						}
						,function(err){
							if( failed ){
								try{ d.resolve((typeof failed==='function')? failed.call(null,err) : failed); }catch(e){ d.reject(e);}
							}else{
								d.reject(err);
							}
						}
					]);
					if(status!==0){
						alwaysAsync?nextTick(execCallbacks):execCallbacks();
					}
					return d.promise;
				}
				,success:function(fulfilled){ return this.then(fulfilled,null); }
				,error:function(failed){ return this.then(null,failed); }
				,apply:function(fulfilled,failed){ return this.then(function(a){ return (typeof fulfilled==='function')?fulfilled.apply(null,a):fulfilled;},failed || null); }
				,rethrow:function(failed){ return this.then(null,failed ? function(err){ failed(err); throw err;} : rethrow); }
				,isPending:function(){
					return status === 0 ? true:false;
				}
				,getStatus:function(){ return status;}
			};
		promise.toSource = promise.toString = promise.valueOf = function(){return value === undefined ? this : value; };
		function execCallback(cb){
			cb && cb.call(null,value);
		}
		function execCallbacks(){
			if(status === 0){
				return;
			}
			var cbs=pendings, i=0, l=cbs.length, cbIndex=~status?0:1;
			pendings=[];
			for(;i<l;i++){
				execCallback(cbs[i][cbIndex]);
			}
		}
		function resolve(val){
			if( status ){
				return;
			}
			if(val && val.then){ // managing a promise
				var valStatus = val.getStatus();
				if(! valStatus){
					val.then(function(r){try{resolve(r);}catch(e){reject(e);}},reject);
					return;
				}
				val.valueOf && (val = val.valueOf());
				if( !~valStatus ){
					reject(val);
					return;
				}
			}
			value = val;
			status=1;
			alwaysAsync?nextTick(execCallbacks):execCallbacks();
		}
		function reject(Err){
			if( status !== 0){
				return;
			}
			try{ throw(Err); }catch(e){ value = e; }
			status = -1;
			alwaysAsync?nextTick(execCallbacks):execCallbacks();
		}
		return {
			promise:promise
			,resolve:resolve
			,fulfill:resolve // alias
			,reject:reject
		};
	};


	defer.defer = defer;
	//-- return a promise which will be resolved in time ms
	defer.wait = function(time){ var d=defer(); setTimeout(d.resolve,time||0); return d.promise; };
	//-- return a promise for the return value of fn which will be resolved in delay ms
	defer.delay = function(fn,delay){
		var d=defer();
		setTimeout(function(){ try{ d.resolve(fn.apply(null)); }catch(e){ d.reject(e); }  },delay||0);
		return d.promise;
	};
	//-- if given value is not a promise return a fullfilled promise resolved to given value 
	defer.promisify = function(promise){
		if(promise && promise.then){ return promise;}
		var d = defer();
		d.resolve(promise);
		return d.promise;
	};
	defer.nextTick = nextTick;
	//-- return a promise for all given promises / values
	defer.all = function(){ /*jshint loopfunc:true*/
		var A=arguments;
		if( A.length === 1 && ( A[0] instanceof Array) ){
			if( A[0].length ){
				return defer.all.apply(defer,A[0]);
			}else{
				var D=defer();D.resolve(A[0]);
				return D.promise;
			}
		}
		var args=[]
			, d=defer()
			, promises=Array.prototype.slice.apply(A)
			, c=promises.length
		;
		if( ! c ){
			d.resolve(args);
		}else{
			for( var i=0,l=c;i<l;i++){
				(function(i){
					var p = defer.promisify(promises[i]);
					p.then(
						function(v){
							if( i in args ){ return; }
							args[i] = v;
							(--c) || d.resolve(args);
						}
						,function(e){  (i in args) || d.reject(e); }
					);
				})(i);
			}
		}
		return d.promise;
	};

	defer.alwaysAsync=false; // setting this will change default behaviour. use it only if necessary as asynchronicity will force some delay between your promise resolutions and is not always what you want.

	defer.nodeCapsule=function(subject,fn){
		if( typeof subject === 'function' ){
			fn=subject; subject=void(0);
		}
		return function(){
			var d = defer();
			var args = [].slice.apply(arguments);
			args.push(function(err,res){
				 err ? d.reject(err) : d.resolve( arguments.length > 2 ? [].slice.call(arguments,1) : res);
			});
			fn.apply(subject,args);
			return d.promise;
		}
	};

	(typeof window !== 'undefined') ? ( window.D = defer) : ( module.exports = defer);
})();
