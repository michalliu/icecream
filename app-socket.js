/* global __dirname,process,require, console, exports*/
// var SERVER_PORT=8000;

var WebSocket = require('websocket');
var EventEmitter = require('events').EventEmitter;
var WebSocketServer = WebSocket.server;
var childProcess = require('child_process');

// var Httpd = require('http');
var clients = [];
var statusClients=[];
var graphClients=[];

var controlClient;
var undef;

var cpuProfilingProcess;
var memProfilingProcess;
var resourceOwnerClient;

var serverEvent = new EventEmitter();

var ROLE={
	STATUS: 'status',
	GRAPH: 'graph',
	CONTROL: 'control',
	RESOURCE_OWNER: 'resourceOwner'
};

var COMMAND={
	// 0x1*** Messages
	STATUS_PEER_COUNT_UPDATE: 0x1000,
	GRAPH_PEER_COUNT_UPDATE:  0x1001,
	LOGGING_MESSAGE_UPDATE:   0x1002,
	ERROR_MESSAGE:            0x1003,
	CPU_USAGE:                0x1004,
	MEM_USAGE:                0x1005,

	// 0x2*** Control command
	RUN_COMMAND_TEST:         0x20000,

	// CPU PROFILING
	START_CPU_PROFILING:      0x20001,
	END_CPU_PROFILING:        0x21001,

	// MEM PROFILING
	START_MEM_PROFILING:      0x20002,
	END_MEM_PROFILING:        0x21002,
	
	// RESOURCE OWNER COMMAND
	RESOURCE_COMMAND_ADDR:    0x30000,
	RESOURCE_COMMAND_ADDR_RESERVE:    0x1000,

	// RESOURCE OWNER STATUS REPORT
	RESOURCE_PA_START:    0x40000,
	RESOURCE_PA_ASSERTION_FAIL:    0x40001,
	RESOURCE_PA_STOP:    0x41000
};

function now(){
	var d=new Date();
	return d.getUTCFullYear() + '/'+
  ('0' + (d.getUTCMonth()+1)).slice(-2) +'/'+
  ('0' + d.getUTCDate()).slice(-2) + ' ' +
  ('0' + d.getUTCHours()).slice(-2) + ':' +
  ('0' + d.getUTCMinutes()).slice(-2) + ':' +
  ('0' + d.getUTCSeconds()).slice(-2);
}

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

function pushLog() {
	pushMessage(statusClients,{
		type: COMMAND.LOGGING_MESSAGE_UPDATE,
		value: logs.join('\n')
	});
}

function count(connections) {
	return connections.reduce(function reduce_connections(previous, current) {
		if (current !== undef) {
			previous++;
		}
		return previous;
	},0);
}

var logger;
var logs = [];
logger = {
	log: function logger_log (message) {
		if (typeof message === 'string') {
			message = now() + ' ' + message;
		}
		console.log(message);
		logs.push(message);
		if (logs.length > 50) {
			logs.shift();
		}
		pushLog();
	}
};

exports.serverEvent=serverEvent;
exports.server={
	start: function (httpd) {
		var wsServer = new WebSocketServer({
			httpServer: httpd
		});
		function originIsAllowed() {
			return true;
		}
		wsServer.on('request', function wsServer_onRequest(request){
			if (!originIsAllowed(request.origin)) {
				request.reject();
				logger.log('Reject connection from origin ' + request.origin);
			}
			var connection = request.accept(null, request.origin);
			var index = clients.push(connection) - 1;
			var statusIndex, graphIndex;
			logger.log('Accept connection from origin ' + request.origin);
			logger.log(count(clients) + ' peers connected');

			function handleCommandMessage (commandMessage) {
				var binaryPath;
				if (commandMessage.command === COMMAND.START_CPU_PROFILING){
					binaryPath = __dirname + '\\bin\\QQHelpDemo.exe';
					logger.log('start cpu profiling');
					cpuProfilingProcess = childProcess.spawn(binaryPath, ['cpuusage'], {
						cwd: undef,
						env:process.env
					});
					cpuProfilingProcess.stdout.on('data', function cpuProfilingProcess_stdout_handler(data) {
						var usage = data.toString('utf-8').replace(/[\r\n]/g,'');
						pushMessage(graphClients, {
							type: COMMAND.CPU_USAGE,
							value: {
								realtimestamp: Date.now(),
								data: parseFloat(usage)
							}
						});
					});
					cpuProfilingProcess.on('close', function cpuProfilingProcess_exit_handler(code) {
						logger.log('exit ' + code);
					});
				} else if (commandMessage.command === COMMAND.END_CPU_PROFILING && cpuProfilingProcess) {
					logger.log('stop cpu profiling');
					cpuProfilingProcess.kill();
					cpuProfilingProcess = null;
				} else if (commandMessage.command === COMMAND.START_MEM_PROFILING){
					binaryPath = __dirname + '\\bin\\QQHelpDemo.exe';
					logger.log('start mem profiling');
					memProfilingProcess = childProcess.spawn(binaryPath, ['memorysize'], {
						cwd: undef,
						env:process.env
					});
					memProfilingProcess.stdout.on('data', function memProfilingProcess_stdout_handler(data) {
						var usage = data.toString('utf-8').replace(/[\r\n]/g,'');
						if (usage) {
							pushMessage(graphClients, {
								type: COMMAND.MEM_USAGE,
								value: {
									realtimestamp: Date.now(),
									data: parseFloat(usage)
								}
							});
						}
					});
					memProfilingProcess.on('close', function memProfilingProcess_exit_handler(code) {
						logger.log('exit ' + code);
					});
				} else if (commandMessage.command === COMMAND.END_MEM_PROFILING && memProfilingProcess) {
					logger.log('stop mem profiling');
					memProfilingProcess.kill();
					memProfilingProcess = null;
				} else if (commandMessage.command > COMMAND.RESOURCE_COMMAND_ADDR &&
						commandMessage.command <= (COMMAND.RESOURCE_COMMAND_ADDR + COMMAND.RESOURCE_COMMAND_ADDR_RESERVE)) {
					if (resourceOwnerClient && resourceOwnerClient.connected) {
						pushMessage(resourceOwnerClient, {
							type: commandMessage.command,
							value: {
							}
						});
					} else {
						logger.log('Drop resource owner command ' + commandMessage.command + ' , peer not connected');
					}
				} else {
					logger.log('unrecognized command ' + commandMessage.command);
				}
			}

			function handleRoleMessage(roleMessage) {
				if (roleMessage.role === ROLE.STATUS) {
					if (statusIndex === undef) {
						statusIndex = statusClients.push(clients[index]) - 1;
						pushMessage(statusClients,{
							type: COMMAND.STATUS_PEER_COUNT_UPDATE,
							value: count(statusClients)
						});
					} else {
						logger.log('redefine role ' +  ROLE.STATUS + ' is not allowed');
					}
				} else if(roleMessage.role === ROLE.GRAPH) {
					if (graphIndex === undef) {
						graphIndex = graphClients.push(clients[index]) - 1;
						pushMessage(graphClients,{
							type: COMMAND.GRAPH_PEER_COUNT_UPDATE,
							value: count(graphClients)
						});
					} else {
						logger.log('redefine role ' +  ROLE.GRAPH + 'attempt');
					}
				} else if(roleMessage.role === ROLE.CONTROL) {
					// only one control client can exists
					// other peer who declared as control will be disconnected
					if (!controlClient || !controlClient.connected) {
						controlClient=connection;
					} else {
						pushMessage(connection,{
							type:COMMAND.ERROR_MESSAGE,
							value:'Someone is controlling already'
						});
						connection.close();
					}
				} else if(roleMessage.role === ROLE.RESOURCE_OWNER) {
					// only one control client can exists
					// other peer who declared as control will be disconnected
					if (!resourceOwnerClient || !resourceOwnerClient.connected) {
						resourceOwnerClient=connection;
						serverEvent.emit('resouceOwnerConnected', resourceOwnerClient);
					} else {
						pushMessage(connection,{
							type:COMMAND.ERROR_MESSAGE,
							value:'Dual resource owner is not supported'
						});
						connection.close();
					}
				} else {
					logger.log('Incorrect role ' + roleMessage.role);
				}
			}

			function handleResourceStatusMessage(resourceStatusMessage) {
				var msg = resourceStatusMessage;
				if (msg.resourceStatus === COMMAND.RESOURCE_PA_START) {
					serverEvent.emit('resouceOwnerPaStart', resourceOwnerClient);
				} else if(msg.resourceStatus === COMMAND.RESOURCE_PA_ASSERTION_FAIL) {
					serverEvent.emit('resouceOwnerPaAssertionFail', msg.info);
				} else if(msg.resourceStatus === COMMAND.RESOURCE_PA_STOP) {
					serverEvent.emit('resouceOwnerPaStop', resourceOwnerClient);
				} else {
					serverEvent.emit('resourceOwnerPaStep',msg.resourceStatus);
				}
			}

			connection.on('message', function onWSServer_message(message){
				var oMessage;
				if (message.type === 'utf8') {
					oMessage=JSON.parse(message.utf8Data);
					// role report
					if (oMessage.role) {
						handleRoleMessage(oMessage);
					} else if(oMessage.command) {
						handleCommandMessage(oMessage);
					} else if(oMessage.resourceStatus) {
						handleResourceStatusMessage(oMessage);
					} else {
						logger.log('Drop wired message ' + message);
					}
				} else if(message.type === 'binary') {
					logger.log('Drop binary message ' + message.binaryData.length + ' bytes');
				}
				pushLog();
			});

			connection.on('close', function onWSServer_connection() {
				logger.log('Peer ' + index + ' disconnected.');
				// replace with undef, the index is a fixed number
				clients.splice(index,1,undef);
				if (statusIndex !== undef) {
					statusClients.splice(statusIndex,1,undef);
					pushMessage(statusClients,{
						type: COMMAND.STATUS_PEER_COUNT_UPDATE,
						value: count(statusClients)
					});
				} else if (graphIndex !== undef) {
					graphClients.splice(graphIndex,1,undef);
					pushMessage(graphClients,{
						type: COMMAND.GRAPH_PEER_COUNT_UPDATE,
						value: count(graphClients)
					});
				}
				if (controlClient===connection) {
					controlClient = null;
				}
				if (resourceOwnerClient===connection) {
					resourceOwnerClient = null;
					serverEvent.emit('resouceOwnerDisconnected');
				}
				logger.log(count(clients) + ' peers is live,' + count(statusClients) + ' status peers,' + count(graphClients) + ' graph peers' + (controlClient ? ' 1' : ' 0') + ' control peer' + (resourceOwnerClient ? ' 1' : ' 0') + ' resource peer');
			});
		});
	}
};
