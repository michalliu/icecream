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

if (false) {
handler.tick = function () {
	var samplingData=[
    "connected",
    "0",
    "0",
    "0",
    "0",
    "op_start",
    "19.24155",
    "28.40739",
    "16.78771",
    "42.46638",
    "36.15904",
    "18.07737",
    "37.44495",
    "43.75853",
    "26.84913",
    "1.278377",
    "5.09756",
    "1.278685",
    "3.835184",
    "3.835554",
    "0",
    "1.282888",
    "3.848267",
    "21.87611",
    "2.574252",
    "7.670375",
    "5.130913",
    "0",
    "3.848304",
    "2.565506",
    "2.565484",
    "2.565443",
    "1.278541",
    "1.278568",
    "1.282689",
    "1.282776",
    "2.565727",
    "0",
    "3.835644",
    "15.395",
    "33.46152",
    "21.24748",
    "2.565208",
    "2.582356",
    "0",
    "1.278684",
    "2.557112",
    "0",
    "0",
    "3.836055",
    "0",
    "0",
    "8.949741",
    "32.17553",
    "18.07739",
    "30.6568",
    "50.19233",
    "18.07944",
    "14.20368",
    "21.80664",
    "31.64817",
    "21.95135",
    "8.980111",
    "2.557125",
    "2.556808",
    "21.80883",
    "27.11332",
    "7.697352",
    "5.114068",
    "6.391979",
    "3.861169",
    "3.861235",
    "27.02306",
    "25.8283",
    "0",
    "1.278424",
    "14.11197",
    "1.28683",
    "2.573968",
    "0",
    "1.28273",
    "15.44402",
    "11.58413",
    "7.670221",
    "0",
    "6.391964",
    "0",
    "1.282762",
    "7.672055",
    "23.16544",
    "11.54412",
    "12.9134",
    "12.86983",
    "16.7839",
    "24.29256",
    "19.24287",
    "20.59",
    "6.4355",
    "10.26102",
    "9.008906",
    "5.130854",
    "19.17817",
    "24.29275",
    "1.282717",
    "5.114165",
    "op_end",
    "0",
    "6.413736",
    "0",
    "0",
    "0",
    "0",
    "0",
    "disconnected"
  ];
		handler.emit('exit',0,samplingData);
		return
}
	var cpuSamplingProcess;
	var undef;
	var bin = ROOT_PATH + '\\bin\\QQHelpDemo.exe';
	var samplingData=[];

	SERVER_EVENT.removeAllListeners('resouceOwnerDisconnected');
	SERVER_EVENT.removeAllListeners('resouceOwnerConnected');
	SERVER_EVENT.removeAllListeners('resouceOwnerPaStart');
	SERVER_EVENT.removeAllListeners('resouceOwnerPaStop');

	function killCpuSampling(){
		if(cpuSamplingProcess) {
			cpuSamplingProcess.kill();
			cpuSamplingProcess = null;
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
				type: 0x30002
			});
		},2000);
	});

	SERVER_EVENT.on('resouceOwnerDisconnected', function () {
		samplingData.push('disconnected');
		killCpuSampling();
		handler.emit('exit',0,samplingData);
	});

	SERVER_EVENT.on('resouceOwnerPaStart', function () {
		samplingData.push('op_start');
	});


	SERVER_EVENT.on('resouceOwnerPaStop', function () {
		samplingData.push('op_end');

		// stop
		setTimeout(function () {
			// kill win8QQ
			killResourceOwner();
			// stop monitor cpu usage, emit exit first
			setTimeout(killCpuSampling,500);
		}, 2000);
	});

	cpuSamplingProcess = childProcess.spawn(bin, ['cpuusage'], {
		cwd: undef,
		env:process.env
	});

	cpuSamplingProcess.stdout.on('data', function (data) {
		var usage = data.toString('utf-8').replace(/[\r\n]/g,'');
		samplingData.push(usage);
	});

};

exports.handler=handler;
