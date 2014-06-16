var express = require('express')
  , router  = new express.Router()
  , Docker  = require('./dockerode-q')
  , stat    = require('./stat.js')
;

var docker = new Docker({ socketPath: process.env.SOCKET_PATH || '/var/run/docker.sock' });

router.use(function(req, res, next){
  res.error = function(reason){
    res.json(reason.response || 500, { error: String(reason.message || reason) });
  };
  
  res.success = function(data){
    res.json(200, data);
  };
  
  next();
});

router.param('container', function(req, res, next, id) {
  docker.getContainer(id).inspectQ().then(function(info){
    req.container = info;
    next();
  }).catch(res.error);
});


router.get('/:container', function(req, res, next){
  //get all usage
  stat.all(req.container.Id).then(res.success).catch(res.error);
});

router.get('/:container/mem', function(req, res, next){
  //get memory usage
  stat.mem(req.container.Id).then(res.success).catch(res.error);
});

router.get('/:container/cpu', function(req, res, next){
  //get cpu usage
  stat.cpu(req.container.Id).then(res.success).catch(res.error);
});

router.get('/:container/hdd', function(req, res, next){
  //get hdd usage
  stat.hdd(req.container.Id).then(res.success).catch(res.error);
});

exports.router = router;