#D.js
D.js is a tiny implementation of promises/A+ made for nodejs and client-side browser
[![Build Status](https://travis-ci.org/malko/D.js.png?branch=master)](https://travis-ci.org/malko/D.js)

If you want to know more about promises/A+ you can visit this page: http://promises-aplus.github.io/promises-spec/
<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         alt="Promises/A+ logo" title="Promises/A+ 1.0 compliant" align="right" />
</a>

## installation
### nodejs
```npm install d.js```
### browsers
clone the repository or just copy the files D.js or D.min.js to your server and then include it in your pages with a classic 
```<script src="D.js"></script>```
or using a javascript loader like [l.js](https://github.com/malko/l.js)

## Making an async method that return a promise:

example in node js wrapping the fs.readFile function to work with promise
```javascript
var fs = require('fs')
	, D = require('d.js')
;

// define a method that will return a promise of a file read content
function readPromise(filename){
	var deferred = D();
	fs.readFile(filename, function (err, data) {
  		if( err ){
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	};
	return deferred.promise;
}
// use our readPromise method we don't pass in a callback, we will pass it to the then method
readPromise('/etc/passwd')
	.then( // the then method return a promise as well so we can chain then calls
		function(data){ console.log(data); }
		,function(err){ console.log(err); }
	)
;
```
## Addition to the Promises/A+ specs
D.js offers a little more than the promises/A+ specification requirements here's the api:

### Promises methods
In addition to the unique **then** method required by the specifications D.js add supports of the following to each promises:
```javascript
promise.isPending() // return false if the promise is fulfilled or rejected, true otherwise
promise.getStatus() // return -1 if rejected, 0 is pending and 1 if fulfilled
promise.success(onFulfilled); // same as promise.then(onFulfilled);
promise.error(onRejected);   // same as promise.then(undefined,onRejected);
promise.apply(onFulfilled,onRejected);
promise.rethrow(onRejected) // helper for onRejected method that rethrow the reason of the rejection
promise.rethrow() // see below for more info on rethrow behaviour
```

The **apply** method is a minor variation of the **then** method but specifically useful for promises of Array. Instead of getting the promised Array passed as a single parameter to the onFulfilled callback it will apply it to the callback so each values of the promised array will become single parameters of the callback here a code example;

```javascript
var arrayPromise = D.resolved([1,2,3]); // we'll talk about resolved later
arrayPromise.then(function(a){ /* a will contains the whole array */ })
arrayPromise.apply(function(a,b,c){ /* a will be 1, b is 2 and c is 3 */ }
```

The **rethrow** method serves two different purposes
- if received an onRejected method it will just ensure that onRejected rethrow the error this is just an helper here's an exemple of the same behaviour without using rethrow

```javascript
var onRejectedResolve = function(reason){
	console.error(reason);
	return 'resolvedvalue';
}

// first example the error is resolved
promise
	.error(onRejectedResolve)
	.success(function(a){
		/* a now contains 'resolvedvalue' */
	})
;

// second example we want the same errorHandler but we don't want to resolve
promise
	.error(function(reason){
		onRejectedResolve(reason);
		throw reason;
	})
	.success(function(a){
		/* this success will never get called */
	})
;

// third example using the same errorHandler and rethrow. 
//This does exactly the same thing as second example 
promise
	.rethrow(onRejectedResolve)
	.success(function(a){
		/* this success will never get called */
	})
;
```
- if no onRejected callback is given then it will behave differently. When you use a Promises/A+ library no Error is thrown outside of your promise library so it's sometimes difficult to debug. For this purpose you can use **rethrow** method that will really re-throw the error outside of the promise library. this is really useful for debugging but also to end your promise chain when you want an error to be effectively thrown.

```javascript
promise
	.success(function(){
		throw "there's no good reason";
	})
	.error(function(reason){
		console.error(reason); 
		throw reason; 
		/* 
		even throwing again the reason won't make the reason visible outside the promise library
		the error will go to the next error handler or simply be ignored if no error handler exists
		*/
	})
	// rethrow call WITHOUT ANY PARAMATER will rejectet the reason in the outside world and you will see an uncaught error
	.rethrow()
;
```

## D properties and methods 

#### D() or D.defer()
return a __deferred__ object with **promise** as a property and **resolve**, **fulfill** (alias of resolve), **reject** as methods
#### D.alwaysAsync = true
setting this to false will broke the compliance to the Promises/A+ specification but will try to resolve promise immediatly if the value is available instead of forcing an async resolution this is not a recommended behaviour but it may be useful in some cases
#### D.onlyFuncs = true
This setting passed to false will also break compliance with the Promises/A+ specification by allowing then, success, error, apply and rethrow to received values instead of callbacks for onFulfilled or onRejected and will resolve the promise with thoose values.
#### D.resolved(value), D.fulfilled(value)
return a resolved promise of __value__
#### D.rejected(reason)
return a rejected promise with given __reason__
#### D.wait(time)
return a promise that will resolve in __time__ ms
#### D.delay(fn,delay)
return a promise for the return value of __fn__ which will be resolved in __delay__ ms
#### D.promisify(value)
internal method exposed that will return a resolved promised of value if value isn't a promise
#### D.all(listOfPromise), D.all(promise0,promise1,promise....)
take a list of promise as single Array or as list or parameters and return a promise that will resolved only when all given promised are resolved. the promise will received given promises values as parameters
#### D.nodeCapsule(fn), D.nodeCapsule(subject,fn)
encapsulate typical node methods that wait for a callback(Err,param1,param2...) as last parameters and return the wrapped method which will return a promise of response usable with then, succes, ...
ie:
```javascript
var fs = require('fs')
	, D = require('d.js')
	, readFile = D.nodeStyle(fs,fs.readFile)
;

readFile('/etc/passwd')
	.success(function(data){ console.log(data); })
	.rethrow()
;
```
