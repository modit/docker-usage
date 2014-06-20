var express = require('express')
  , router  = new express.Router()
  , Docker  = require('../utils/dockerode-q')
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
  res.success(stat.getUsage(req.container.Id));
});

exports.router = router;