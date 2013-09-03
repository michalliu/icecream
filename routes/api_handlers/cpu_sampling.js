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
    "0",
    "0",
    "0",
    "op_start",
    "16.62269",
    "8.920774",
    "25.73662",
    "32.17453",
    "42.33538",
    "10.26078",
    "12.86962",
    "12.87026",
    "19.304",
    "2.565491",
    "1.274362",
    "3.861029",
    "2.548657",
    "3.810699",
    "2.565797",
    "3.822641",
    "op_step1,5,1,1",
    "5.131009",
    "20.38934",
    "6.309946",
    "8.921728",
    "2.573971",
    "1.286977",
    "1.274361",
    "34.51972",
    "1.27437",
    "2.531887",
    "1.25002",
    "2.523648",
    "0",
    "1.274389",
    "8.920419",
    "2.548708",
    "0",
    "op_step2,5,1,1",
    "36.03901",
    "36.83206",
    "18.99085",
    "6.35181",
    "5.063751",
    "1.270357",
    "2.565505",
    "0",
    "0",
    "1.265933",
    "1.266099",
    "0",
    "21.80674",
    "21.88116",
    "0",
    "15.34431",
    "op_step3,5,1,1",
    "41.18269",
    "33.46204",
    "8.920468",
    "14.01808",
    "10.29585",
    "19.23897",
    "14.10996",
    "2.548764",
    "5.08084",
    "5.098047",
    "9.007807",
    "3.82343",
    "7.571125",
    "8.862611",
    "2.532213",
    "6.351681",
    "op_step4,5,1,1",
    "7.620506",
    "20.32349",
    "37.07787",
    "18.01737",
    "5.114437",
    "3.822869",
    "11.432",
    "10.16275",
    "1.270233",
    "10.1279",
    "8.863319",
    "5.064322",
    "2.515856",
    "5.0155",
    "0",
    "2.548668",
    "1.266008",
    "op_step5,5,1,1",
    "24.37108",
    "10.26195",
    "10.195",
    "15.39307",
    "10.12866",
    "24.213",
    "19.1154",
    "10.19585",
    "14.01669",
    "20.59174",
    "op_end",
    "11.5828",
    "6.434912",
    "15.44349",
    "0",
    "3.798265",
    "15.39301",
    "11.58284",
    "9.007568",
    "disconnected"
  ];
		handler.emit('exit',0,samplingData);
		return
}
	var cpuSamplingProcess;
	var undef;
	var bin = ROOT_PATH + '\\bin\\QQHelpDemo.exe';
	var samplingData=[];

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
