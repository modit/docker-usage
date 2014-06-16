var express = require('express')
  , app     = express()
  , server  = require('http').Server(app)
  , v1      = require('./api/v1')
;

function Server(){
  
  app.use('/api/v1', v1.router);

  server.listen(process.env.WEB_PORT || 80, function() {
    console.log('Listening on port %d', server.address().port);
  });
  
  this.close = function(cb){
    return server.close(cb);
  };
}

module.exports = Server;

