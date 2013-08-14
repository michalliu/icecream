
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Index' });
};

exports.control = require('./control');
exports.graph = require('./graph');
exports.status = require('./status');
exports.help = require('./help');
