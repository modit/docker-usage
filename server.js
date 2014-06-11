var express = require('express')
  , app     = express()
  , v1     = require('./api/v1')
;

app.use('/api/v1', v1.router);

var server = app.listen(process.env.WEB_PORT || 80, function() {
  console.log('Listening on port %d', server.address().port);
});