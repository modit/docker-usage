var cluster = require('cluster')
  , os      = require('os')
  , fs      = require('fs-extra')
  , winston = require('winston')
  , Path    = require('path')
  , Server  = require('./server')
  , Grace   = require('./grace')
  , debug   = process.execArgv.join(' ').indexOf('--debug') !== -1
;

var LOG_PATH = Path.resolve(process.env.LOG_PATH || '/log/builder');

if (cluster.isMaster && !debug) {
  cluster.setupMaster({ silent: true });
  
  fs.mkdirsSync(LOG_PATH);

  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: LOG_PATH + '/info.log', maxsize: 102400 })
    ],
    exceptionHandlers: [
      new (winston.transports.Console)(),
      new winston.transports.File({ filename: LOG_PATH + '/exception.log', maxsize: 102400 })
    ]
  });
  
  //fork workers
  for (var i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }

  //if worker dies, start it back up
  cluster.on('exit', function(worker, code, signal) {
    logger.info('Worker ' + worker.id + ' died');
    cluster.fork();
  });
  
  cluster.on('fork', function(worker){
    worker.process.stdout.on('data', function(buffer) {
      logger.info('worker ' + worker.id + ': ' + buffer);
    });
    worker.process.stderr.on('data', function(buffer) {
      logger.warn('worker ' + worker.id + ': ' + buffer);
    });
  });
  
  Grace(function(cb){
    cluster.removeAllListeners('exit');
    (function checkWorkers(){
      if(!Object.keys(cluster.workers).length){
        return cb();
      }
      setTimeout(checkWorkers, 25);
    })();
  });
} else {
  //Start server
  var server = new Server();
  
  Grace(server);
}