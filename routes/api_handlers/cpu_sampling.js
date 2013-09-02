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
if (true) {
	var samplingData=[
 	"connected",
    "0",
    "0",
    "5.131595",
    "op_start",
    "7.671195",
    "7.721558",
    "2.574197",
    "1.266116",
    "1.278518",
    "6.413876",
    "0",
    "2.556794",
    "0",
    "0",
    "0",
    "19.11332",
    "18.07723",
    "1.282731",
    "47.30619",
    "33.57275",
    "25.9107",
    "op_step1,7,1,1",
    "op_step2,7,1,1",
    "39.90101",
    "22.02147",
    "33.57172",
    "25.82779",
    "24.53078",
    "28.40729",
    "24.53357",
    "27.02699",
    "25.82635",
    "25.8259",
    "25.82184",
    "24.53686",
    "23.24195",
    "28.404",
    "24.53365",
    "24.53354",
    "op_step3,7,1,1",
    "30.99387",
    "36.03543",
    "36.03455",
    "29.59786",
    "51.82041",
    "33.4621",
    "39.89632",
    "34.74846",
    "27.20936",
    "21.87866",
    "29.69503",
    "24.61474",
    "24.53359",
    "24.53359",
    "24.53359",
    "24.45298",
    "24.45267",
    "op_step4,7,1,1",
    "46.4847",
    "46.48608",
    "33.57456",
    "39.89697",
    "29.69856",
    "28.50177",
    "28.31304",
    "25.9076",
    "25.82533",
    "28.31352",
    "25.91021",
    "29.60097",
    "20.65956",
    "25.74294",
    "25.82483",
    "29.79724",
    "op_step5,7,1,1",
    "28.40406",
    "30.99286",
    "24.53119",
    "24.53357",
    "25.8244",
    "25.82524",
    "25.82436",
    "28.40738",
    "24.53354",
    "25.7396",
    "25.82486",
    "24.45396",
    "25.82675",
    "24.61519",
    "23.24154",
    "27.11653",
    "24.53075",
    "op_step6,7,1,1",
    "23.16561",
    "11.58275",
    "2.557135",
    "10.32977",
    "5.147918",
    "18.01804",
    "11.62099",
    "1.28697",
    "7.722949",
    "3.848152",
    "op_step7,7,1,1",
    "op_end",
    "2.556772",
    "12.7855",
    "1.234187",
    "0",
    "11.50714",
    "3.860914",
    "10.29592",
    "6.456189",
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
