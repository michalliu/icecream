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
	if (false) {
		var samplingData=[
    "connected",
    "op_start",
    "36948",
    "36444",
    "36444",
    "36444",
    "37472",
    "37328",
    "37308",
    "36932",
    "35656",
    "35676",
    "35676",
    "35904",
    "35936",
    "35936",
    "35960",
    "35960",
    "35960",
    "35960",
    "36080",
    "36080",
    "36100",
    "36128",
    "36128",
    "36128",
    "36300",
    "36300",
    "36300",
    "36300",
    "36032",
    "36032",
    "36032",
    "36404",
    "36404",
    "36404",
    "36480",
    "36480",
    "36480",
    "36540",
    "36576",
    "36576",
    "36576",
    "36592",
    "36592",
    "35440",
    "35384",
    "35384",
    "35384",
    "35408",
    "35408",
    "35408",
    "35408",
    "36024",
    "36024",
    "36024",
    "36016",
    "36016",
    "36016",
    "36012",
    "36012",
    "36012",
    "36020",
    "36020",
    "36020",
    "36020",
    "36056",
    "36056",
    "36056",
    "36056",
    "36056",
    "36056",
    "36092",
    "36092",
    "36092",
    "36092",
    "35732",
    "35732",
    "35732",
    "36260",
    "36260",
    "36260",
    "36268",
    "36268",
    "36268",
    "36300",
    "36256",
    "36260",
    "36260",
    "36216",
    "36216",
    "36216",
    "36408",
    "36408",
    "36408",
    "36348",
    "36348",
    "36348",
    "36348",
    "36408",
    "36408",
    "36408",
    "35968",
    "35968",
    "35968",
    "36012",
    "36012",
    "36012",
    "36032",
    "36032",
    "36032",
    "36032",
    "36400",
    "36400",
    "36400",
    "36224",
    "36224",
    "36224",
    "37000",
    "36960",
    "36964",
    "36972",
    "36844",
    "36844",
    "36844",
    "op_end",
    "36408",
    "36408",
    "36408",
    "36236",
    "36236",
    "36236",
    "35772",
    "disconnected"
  ];
		handler.emit('exit',0,samplingData)
		return;
	}
	var memSamplingProcess;
	var undef;
	var bin = ROOT_PATH + '\\bin\\QQHelpDemo.exe';
	var samplingData=[];

	SERVER_EVENT.removeAllListeners('resouceOwnerDisconnected');
	SERVER_EVENT.removeAllListeners('resouceOwnerConnected');
	SERVER_EVENT.removeAllListeners('resouceOwnerPaStart');
	SERVER_EVENT.removeAllListeners('resouceOwnerPaStop');

	function killMemSampling(){
		if(memSamplingProcess) {
			memSamplingProcess.kill();
			memSamplingProcess = null;
		}
	}

	function killResourceOwner() {
		childProcess.spawn(bin, ['kill'], {
			cwd:undef,
			env:process.env
		});
	}

	// kill existing resource owner
	killResourceOwner();

	// waiting win8QQ connect
	SERVER_EVENT.on('resouceOwnerConnected', function (resourceOwner) {
		samplingData.push('connected');
		// waiting testmanager loaded
		setTimeout(function () {
			// performance analysis start
			pushMessage(resourceOwner,{
				type: 0x30003
			});
		},2000);
	});

	SERVER_EVENT.on('resouceOwnerDisconnected', function () {
		samplingData.push('disconnected');
		killMemSampling();
		handler.emit('exit',0,samplingData);
	});

	SERVER_EVENT.on('resouceOwnerPaStart', function () {
		samplingData.push('op_start');
	});

	SERVER_EVENT.on('resourceOwnerPaStep', function (stepStatus) {
		samplingData.push('op_step'+stepStatus);
	});

	SERVER_EVENT.on('resouceOwnerPaStop', function () {
		samplingData.push('op_end');

		// stop
		setTimeout(function () {
			// kill win8QQ
			killResourceOwner();
			// stop monitor cpu usage, emit exit first
			setTimeout(killMemSampling,500);
		}, 2000);
	});

	memSamplingProcess = childProcess.spawn(bin, ['memorysize'], {
		cwd: undef,
		env:process.env
	});

	memSamplingProcess.stdout.on('data', function (data) {
		var usage = data.toString('utf-8').replace(/[\r\n]/g,'');
		if (usage) {
			samplingData.push(usage);
		}
	});

};

exports.handler=handler;
