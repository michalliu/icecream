/*global require,exports,console*/
/*
 * API Routes
 */

var apiModules={};
var apiModulesDir="./api";

exports.index = function(req, res){
	var apiName = req.params[0];
	var apiModule = apiModules[apiName];
	var apiHandler;
	if (!apiModule) {
		try {
			apiModule=require(apiModulesDir="./api/"+apiName);
		} catch(ex){}
	}
	if (apiModule) {
		apiHandler=apiModule.handler;
		apiHandler.on("exit", function (exitcode, data) {
			res.json(200, {
				ret:exitcode,
				target: data
			});
		});
	} else {
		res.json(200, {
			ret:-1,
			message: "invalid api name " + apiName
		});
	}
};
