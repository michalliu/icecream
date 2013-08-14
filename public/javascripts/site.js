/*jshint unused:false,browser:true*/
var WS_SERVER=document.location.origin.replace(/^http/,'ws');
var COMMAND={
	// 0x1*** Messages
	STATUS_PEER_COUNT_UPDATE: 0x1000,
	GRAPH_PEER_COUNT_UPDATE:  0X1001,
	LOGGING_MESSAGE_UPDATE:   0x1002,
	ERROR_MESSAGE:            0x1003,
	CPU_USAGE:                0x1004,
	MEM_USAGE:                0x1005
};

function showAlert(message,type) {
	var alertArea = document.getElementById('alert-area');
	var messageDiv = document.createElement('div');
	type = type || 'info';
	message = message || '';
	messageDiv.innerHTML='<div class="alert alert-' + type + '">' + message + '<button type="button" class="close" data-dismiss="alert">&times;</button></div>';
	//alertArea.innerHTML='';
	alertArea.appendChild(messageDiv);
}
