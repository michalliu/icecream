
/*
 * GET Control page.
 */

exports.index = function(req, res){
  res.render('graph', { title: 'Graph' });
};
