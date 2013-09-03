/*global require,exports,console,SERVER_EVENT*/
/*
 * API Routes
 */

var apiModulesDir="./api_handlers/";

function removeListeners(){
	SERVER_EVENT.removeAllListeners("resouceOwnerDisconnected");
	SERVER_EVENT.removeAllListeners("resouceOwnerConnected");
	SERVER_EVENT.removeAllListeners("resouceOwnerPaStart");
	SERVER_EVENT.removeAllListeners("resouceOwnerPaStop");
}

exports.index = function(req, res){
	var apiName = req.params[0];
	var apiHandler, apiModule;
	// API Request has a very long timeout
	req.connection.setTimeout(60 * 60 * 1000);
	try {
		apiModule=require(apiModulesDir+apiName);
	} catch(ex){}

	if (apiModule) {
		apiHandler=apiModule.handler;
		apiHandler.removeAllListeners("exit");
		apiHandler.on("exit", function (exitcode, data) {
			removeListeners();
			res.json(200, {
				ret:exitcode,
				timestamp:Date.now(),
				data: data
			});
		});
		removeListeners();
		apiHandler.tick();
	} else {
		res.json(200, {
			ret:-1,
			message: "invalid api name " + apiName
		});
	}
};
