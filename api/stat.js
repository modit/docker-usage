var Q       = require('q')
  , fs      = require('fs')
  , LRU     = require('lru-cache')
  , Docker  = require('../utils/dockerode-q')
;

var docker = new Docker({ socketPath: process.env.SOCKET_PATH || '/var/run/docker.sock' });

var MEM_DIR = process.env.MEM_DIR || '/sys/fs/cgroup/memory/docker/';
var CPU_DIR = process.env.CPU_DIR || '/sys/fs/cgroup/cpuacct/docker/';
var MAX_INTERVAL = process.env.MAX_INTERVAL || 500;

var imageCache      = LRU({ max: 10000 });
var containerCache  = LRU({ max: 10000 });
var lastCheck = Date.now();
var ioEmitter;

function requestUpdate(){
  setTimeout(update, MAX_INTERVAL - (Date.now() - lastCheck));
}

function update(){
  lastCheck = Date.now();
  
  return docker.listContainersQ({ size: true }).then(function(containers){
    return Q.all(containers.map(function(container){
      
      return Q.all([
        getHddUsage(container),
        getMemUsage(container),
        getCpuUsage(container)
      ]).spread(function(hdd, mem, cpu){
        var usage = {
          hdd: hdd,
          mem: mem,
          cpu: cpu
        };
      
        containerCache.set(container.Id, usage);
        
        if(ioEmitter){
          ioEmitter.emit('usage', { id: container.Id, usage: usage });
        }
      });
      
    }));
  }).catch(console.warn).then(requestUpdate);
  
}

function noFileCatch(error){
  if(error.errno === 34) {
    return 0;
  }
  return Q.reject(error);
}

function getImageSize(id){
  return docker.getImage(id).historyQ().then(function(layers){
    var size = layers.reduce(function(total, layer){
      return total + parseInt(layer.Size, 10);
    }, 0);
    imageCache.set(id, size);
    return size;
  });
}

function getHddUsage(container){
  return Q.fcall(function(){
    return imageCache.get(container.Image) || getImageSize(container.Image);
  }).then(function(imageSize){
    return {
      image: imageSize,
      container: parseInt(container.SizeRw)
    };
  });
}
function getMemUsage(container){
  return Q.ninvoke(fs, 'readFile', MEM_DIR + container.Id + '/memory.usage_in_bytes').catch(noFileCatch).then(parseInt);
}

function getCpuUsage(container){
  return Q.ninvoke(fs, 'readFile', CPU_DIR + container.Id + '/cpuacct.usage').catch(noFileCatch).then(parseInt);
}

module.exports = {
  io: function(io){
    ioEmitter = io;
  },
  getUsage: function(id){
    return containerCache.get(id);
  }
};

requestUpdate();