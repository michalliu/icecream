/*jshint node:true*/
/*globals ROOT_PATH,SERVER_EVENT*/
var EventEmitter = require('events').EventEmitter;
var childProcess = require('child_process');
var handler = new EventEmitter();

function pushMessage(connections, message) {
	var messageStr = JSON.stringify(message);
	if (!connections) {
		console.log('cant\'t push message, invalid connection');
		return;
	}
	if (connections.forEach) {
		connections.forEach(function enun_connections(conn) {
			// conn might be undefined if disconnected
			if (conn) {
				conn.sendUTF(messageStr);
			}
		});
	} else if (connections.sendUTF) {
		connections.sendUTF(messageStr);
	}
}

handler.tick = function () {
	var cpuSamplingProcess;
	var undef;
	var bin = ROOT_PATH + '\\bin\\QQHelpDemo.exe';
	var samplingData=[];

	SERVER_EVENT.removeAllListeners('resouceOwnerDisconnected');
	SERVER_EVENT.removeAllListeners('resouceOwnerConnected');
	SERVER_EVENT.removeAllListeners('resouceOwnerPaStart');
	SERVER_EVENT.removeAllListeners('resouceOwnerPaStop');

	// waiting win8QQ connect
	SERVER_EVENT.on('resouceOwnerConnected', function (resourceOwner) {
		console.log('rc');
		// waiting testmanager loaded
		setTimeout(function () {
			// performance analysis start
			pushMessage(resourceOwner,{
				type: 0x30002
			});
		},500);
	});

	SERVER_EVENT.on('resouceOwnerPaStart', function () {
		console.log('pa start');
		cpuSamplingProcess.stdout.on('data', function (data) {
			var usage = data.toString('utf-8').replace(/[\r\n]/g,'');
			samplingData.push(usage);
		});
	});

	SERVER_EVENT.on('resouceOwnerPaStop', function () {
		handler.emit('exit',0,samplingData);
		cpuSamplingProcess.kill();
		cpuSamplingProcess = null;
	});

	cpuSamplingProcess = childProcess.spawn(bin, ['cpuusage'], {
		cwd: undef,
		env:process.env
	});

	cpuSamplingProcess.stdout.on('close', function () {
		// 非正常退出
		handler.emit('exit',2,'early quit');
	});
};

exports.handler=handler;
