/*jshint browser:true, unused:false */
/*globals console,COMMAND,showAlert,WS_SERVER*/

(function control_init(){
	var command_fire_button=document.getElementById('command_fire');
	var command_text=document.getElementById('command_input');

	command_fire_button.onclick=function () {
		var command = command_text.value;
		if (command) {
			wsConnection.send(JSON.stringify({
				command: parseInt(command,16)
			}));
		}
	};

  var wsConnection;

  function disableCommandFire() {
		command_fire_button.disabled=true;
  }

  (function websocket_init(){
      'use strict';
  
      try{
          wsConnection = new WebSocket(WS_SERVER);
          wsConnection.onopen = function wsConnection_Open(openEvent) {
				var message = 'Connection to ' + WS_SERVER  + ' established';
				console.log(message);
				showAlert(message,'success');
				this.send(JSON.stringify({
					role: 'control'
				}));
          };
          wsConnection.onerror = function wsConnection_Error(errorEvent) {
				var message = 'Connection to ' + WS_SERVER + ' has lost';
				console.error(message);
				showAlert(message,'danger');
          };
          wsConnection.onclose = function wsConnection_Close(closeEvent) {
				var message = 'Connection to ' + WS_SERVER + ' closed';
				console.log(message);
				showAlert(message,'danger');
				disableCommandFire();
          };
      } catch(ex) {
          console.log('initilize websocket connection to ' + WS_SERVER + ' has failed. ' + ex);
      }
  }());

  if(wsConnection) {
		wsConnection.onmessage = onMessageRecieved;
  }

  function onMessageRecieved(wsMessageEvent) {
		var data = JSON.parse(wsMessageEvent.data);
		console.log(data);
		if (data.type === COMMAND.ERROR_MESSAGE) {
			showAlert(data.value,'error',true);
		} else {
			console.log('unhandled message ' + JSON.stringify(data));
		}
  }
}());
