/*globals require, process, __dirname, console,GLOBAL*/
/**
 * Module dependencies.
 */
/* jshint laxcomma:true,eqeqeq:false */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , appsocket = require('./app-socket');

var socket = appsocket.server;

var app = express();

GLOBAL.ROOT_PATH=__dirname;
GLOBAL.SERVER_EVENT= appsocket.serverEvent;

// all environments
app.set('port', process.env.PORT || 8000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/control', routes.control.index);
app.get('/graph', routes.graph.index);
app.get('/status', routes.status.index);
app.get('/help', routes.help.index);
app.get(/\/api\/(\w+$)/, routes.api.index);

socket.start(http.createServer(app).listen(app.get('port'), function(){
  console.log('Server listening on port ' + app.get('port'));
}));
