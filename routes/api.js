/*global require,exports,console*/
/*
 * API Routes
 */

var apiModulesDir="./api_handlers/";

exports.index = function(req, res){
	var apiName = req.params[0];
	var apiHandler, apiModule;
	try {
		apiModule=require(apiModulesDir+apiName);
	} catch(ex){}

	if (apiModule) {
		apiHandler=apiModule.handler;
		apiHandler.removeAllListeners("exit");
		apiHandler.on("exit", function (exitcode, data) {
			res.json(200, {
				ret:exitcode,
				timestamp:Date.now(),
				data: data
			});
		});
		apiHandler.tick();
	} else {
		res.json(200, {
			ret:-1,
			message: "invalid api name " + apiName
		});
	}
};
