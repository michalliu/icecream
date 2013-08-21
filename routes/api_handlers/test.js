/*jshint node:true*/
var EventEmitter = require('events').EventEmitter;
var handler = new EventEmitter();

setTimeout(function () {
	handler.emit('exit', 0, 'test');
}, 500);

exports.handler=handler;
