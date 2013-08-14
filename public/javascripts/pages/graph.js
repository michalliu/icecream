/*jshint browser:true,unused:true */
/*globals d3,console,showAlert,COMMAND, cpuGraph, memoryGraph,WS_SERVER*/
(function graph_init() {
	var wsConnection;
	var cpuUsageData;
	var memoryUsageData;

	(function websocket_init(){
		'use strict';

		try{
			wsConnection = new WebSocket(WS_SERVER);
			wsConnection.onopen = function wsConnection_Open(/*openEvent*/) {
				var message = 'Connection to ' + WS_SERVER  + ' established';
				console.log(message);
				showAlert(message,'success');
				this.send(JSON.stringify({
					role: 'graph'
				}));
			};
			wsConnection.onerror = function wsConnection_Error(/*errorEvent*/) {
				var message = 'Connection to ' + WS_SERVER + ' has lost';
				console.error(message);
				showAlert(message,'danger');
			};
			wsConnection.onclose = function wsConnection_Close(/*closeEvent*/) {
				var message = 'Connection to ' + WS_SERVER + ' closed';
				console.log(message);
				showAlert(message,'danger');
		};
		} catch(ex) {
			console.log('initilize websocket connection to ' + WS_SERVER + ' has failed. ' + ex);
		}
	}());

	function updateStatusPeerCount(count) {
		var peerCount = document.getElementById('peer-count');
		peerCount.textContent = count;
	}

	(function graph_update() {
		var duration = 300;   // 采样间隔300ms，与服务器端保持一致
		var n = 300;          // 采样点数量
		var range = 100;      // CPU占用率范围

		var cpuSampleCounter=0;
		var cpuChart;
		var cpuProfilingStartTime;
		var cpuGraphUpdating;

		var memorySampleCounter=0;
		var memoryChart;
		var memoryProfilingStartTime;
		var memoryGraphUpdating;
		var memoryMax=0;
		
		var animationFactor=duration;

		// read from cpuUsageData
		function updateCpuGraph() {
			var data,path,area,x,xaxis;
			var newdata = cpuUsageData[cpuSampleCounter];
			var animationDuration = duration - animationFactor; // 减法保证实时性，加法保证流畅性

			if (!newdata) {
				cpuGraphUpdating = false;
				return;
			}

			cpuGraphUpdating = true;

			data = cpuChart.data;
			path = cpuChart.path;
			area = cpuChart.area;
			x = cpuChart.x;
			xaxis = cpuChart.xAxis;

			newdata.timestamp = cpuProfilingStartTime + cpuSampleCounter * duration;

			// data[1] is the first data and newdata is the last
			x.domain([data[1].timestamp, newdata.timestamp]);

			data.push(newdata); // add new data

			xaxis
				.transition()
				.duration(animationDuration)
				.ease('linear')
				.call(x.axis);

			path
				.attr('d',area)
				.attr('transform', 'translate(' + -x(data[0].timestamp) + ')')
				.transition()
				.duration(animationDuration)
				.ease('linear')
				.attr('transform','translate(0)')
				.each('end', function tick() {
					updateCpuGraph();
				});

			cpuSampleCounter++;

			data.shift(); // drop first data
		}

		function updateMemoryGraph () {
			var data,path,area,x,y,xaxis,yaxis,tickFormater;
			var dataMax;
			var newdata = memoryUsageData[memorySampleCounter];
			var animationDuration = duration - animationFactor; // 减法保证实时性，加法保证流畅性

			if (!newdata) {
				memoryGraphUpdating = false;
				return;
			}

			memoryGraphUpdating = true;

			data = memoryChart.data;
			path = memoryChart.path;
			area = memoryChart.area;
			x = memoryChart.x;
			y = memoryChart.y;
			tickFormater = memoryChart.tickFormater;
			xaxis = memoryChart.xAxis;
			yaxis = memoryChart.yAxis;

			newdata.timestamp = memoryProfilingStartTime +
				memorySampleCounter * duration;

			// data[1] is the first data and newdata is the last
			x.domain([data[1].timestamp, newdata.timestamp]);

			data.push(newdata); // add new data

			dataMax=d3.max(data, function (d) {
				return d.data;
			});

			memoryMax = Math.max(memoryMax, dataMax);

			y.domain([0, memoryMax]); // update y domain

			xaxis
				.transition()
				.duration(animationDuration)
				.ease('linear')
				.call(x.axis); // update x axis

			yaxis.call(y.axis.tickValues([0, dataMax])); // update y axis

			path
				.attr('d',area)
				.attr('transform', 'translate(' + -x(data[0].timestamp) + ')')
				.transition()
				.duration(animationDuration)
				.ease('linear')
				.attr('transform','translate(0)')
				.each('end', function tick() {
					updateMemoryGraph();
				});

			memorySampleCounter++;

			data.shift(); // drop first data
		}

		function onCpuUsageRecieved(data) {
			if (!cpuUsageData) {
				cpuUsageData=[];
				cpuUsageData.push(data.value);
				// 以第一条数据的时间戳作为基准时间
				cpuProfilingStartTime = data.value.realtimestamp;

				cpuChart = cpuGraph(
						[
							cpuProfilingStartTime - (n-2) * duration,// 第一条数据的时间 
							cpuProfilingStartTime-duration // 最后一条数据的时间
						],
						[0, range],
						d3.range(n).map(function (v,i) { // 构造N条 **历史** 数据记录
							return {
								// 最后一条数据记录的时间应为 start - duration
								// 向前以此类推
								timestamp: cpuProfilingStartTime - (n - 2 - i) * duration,
								data: 0
							};
						}),
						'linear'
						);
			} else {
				// 已初始化过，存储新数据
				cpuUsageData.push(data.value);
			}

			// 触发手动更新
			if (!cpuGraphUpdating) {
				updateCpuGraph();
			}
		}

		function onMemoryUsageRecieved(data) {
			if (!memoryUsageData) {
				memoryUsageData=[];
				memoryUsageData.push(data.value);
				memoryProfilingStartTime = data.value.realtimestamp;
				memoryChart= memoryGraph(
						[
							memoryProfilingStartTime - (n-2) * duration,
							memoryProfilingStartTime-duration
						],
						d3.range(n).map(function (v,i) {
							return {
								timestamp: memoryProfilingStartTime - (n - 2 - i) * duration,
								data: 0
							};
						}),
						'linear'
						);
			} else {
				memoryUsageData.push(data.value);
			}

			if (!memoryGraphUpdating) {
				updateMemoryGraph();
			}
		}

		function onMessageRecieved(wsMessageEvent) {
			var data=JSON.parse(wsMessageEvent.data);
			if (data.type === COMMAND.GRAPH_PEER_COUNT_UPDATE) {
				updateStatusPeerCount(data.value);
			} else if (data.type === COMMAND.CPU_USAGE) {
				onCpuUsageRecieved(data);
			} else if (data.type === COMMAND.MEM_USAGE) {
				onMemoryUsageRecieved(data);
			} else {
				console.log('unhandled message ' + JSON.stringify(data));
			}
		}

		if(wsConnection) {
			wsConnection.onmessage = onMessageRecieved;
		}

	// cpu graph test
	function drawCpuChart(d) {
		onMessageRecieved(
				{
					data: JSON.stringify({
						type: COMMAND.CPU_USAGE,
						value: {
							realtimestamp: Date.now(),
							data: d ? d : 0
						}
					})
				}
		);
	}

	// cpu graph test
	function drawMemoryChart(d) {
		onMessageRecieved(
				{
					data: JSON.stringify({
						type: COMMAND.MEM_USAGE,
						value: {
							realtimestamp: Date.now(),
							//data: d ? d : 0
							data: Math.random() * 1024 + memorySampleCounter * 1024 * 20
						}
					})
				}
		);
	}

	drawCpuChart();
	drawMemoryChart();
	//window.dc=setInterval(drawCpuChart,200);
	//window.dm=setInterval(drawMemoryChart,200);
	})();

}());
