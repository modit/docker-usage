var Q         = require('q')
  , Docker    = require('dockerode')
  , Container = require('dockerode/lib/container')
  , Image     = require('dockerode/lib/image')
;

//Docker methods to convert
['createContainer', 'buildImage', 'createImage', 'listContainers', 'run', 'getEvents', 'pull'].forEach(function(method){
  Docker.prototype[method + 'Q'] = function(){ return Q.npost(this, method, arguments); };
});

//Container methods to convert
['inspect', 'start', 'restart', 'stop', 'remove', 'attach', 'wait', 'commit', 'logs'].forEach(function(method){
  Container.prototype[method + 'Q'] = function(){ return Q.npost(this, method, arguments); };
});

//Image methods to convert
['tag', 'remove', 'inspect', 'history'].forEach(function(method){
  Image.prototype[method + 'Q'] = function(){ return Q.npost(this, method, arguments); };
});


['push'].forEach(function(method){
  Image.prototype[method + 'Q'] = function(opts, auth){
    var deferred = Q.defer();
    this[method](opts, deferred.makeNodeResolver(), auth);
    return deferred.promise;
  };
});

module.exports = Docker;