/*jshint node:true*/
var EventEmitter = require('events').EventEmitter;
var handler = new EventEmitter();

setTimeout(function () {
	main.emit('exit', 0, 'test');
}, 1000);

exports.handler=handler;
