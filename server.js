var express = require('express')
  , app     = express()
  , server  = require('http').Server(app)
  , io      = require('socket.io')(server)
  , v1      = require('./api/v1')
  , stat    = require('./api/stat')
;

function Server(){
  
  app.use('/api/v1', v1.router);
  
  stat.io(io);

  server.listen(process.env.WEB_PORT || 80, function() {
    console.log('Listening on port %d', server.address().port);
  });
  
  this.close = function(cb){
    return server.close(cb);
  };
}

module.exports = Server;

