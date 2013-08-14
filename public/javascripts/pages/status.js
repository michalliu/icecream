/*jshint browser:true,unused:false */
/*globals console,showAlert,COMMAND,WS_SERVER*/
(function status_init() {
  var wsConnection;

  (function websocket_init(){
      'use strict';
  
      try{
          wsConnection = new WebSocket(WS_SERVER);
          wsConnection.onopen = function wsConnection_Open(openEvent) {
				var message = 'Connection to ' + WS_SERVER  + ' established';
				console.log(message);
				showAlert(message,'success');
				this.send(JSON.stringify({
					role: 'status'
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
          };
      } catch(ex) {
          console.log('initilize websocket connection to ' + WS_SERVER + ' has failed. ' + ex);
      }
  }());
	
  if(wsConnection) {
		wsConnection.onmessage = onMessageRecieved;
  }

  function updateStatusPeerCount(count) {
	var peerCount = document.getElementById('peer-count');
	peerCount.textContent = count;
  }

  function updateDebugMessage(debugMessage) {
	var logging = document.getElementById('status-logging');
	logging.value=debugMessage;
  }

  function onMessageRecieved(wsMessageEvent) {
		var data = JSON.parse(wsMessageEvent.data);
		if (data.type === COMMAND.STATUS_PEER_COUNT_UPDATE) {
			updateStatusPeerCount(data.value);
		} else if(data.type === COMMAND.LOGGING_MESSAGE_UPDATE){
			updateDebugMessage(data.value);
		} else {
			console.log('unhandled message ' + JSON.stringify(data));
		}
  }

}());
