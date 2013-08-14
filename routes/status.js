
/*
 * GET Control page.
 */

exports.index = function(req, res){
  res.render('status', { title: 'Status' });
};
