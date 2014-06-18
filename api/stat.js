var Q       = require('q')
  , exec    = Q.denodeify(require('child_process').exec)
  , LRU     = require("lru-cache")
  , Docker  = require('../utils/dockerode-q')
;

var docker = new Docker({ socketPath: process.env.SOCKET_PATH || '/var/run/docker.sock' });
 
var MEM_DIR = process.env.MEM_DIR || '/sys/fs/cgroup/memory/docker/';
var CPU_DIR = process.env.CPU_DIR || '/sys/fs/cgroup/cpuacct/docker/';
var HDD_TTL = process.env.HDD_TTL || 1000;

var imageCache      = LRU({ max: 10000 });
var containerCache  = LRU({ max: 10000 });
var lastSizeCheck   = 0;

function noFileCatch(error){
  if(error.code === 1) {
    return 0;
  }
  return Q.reject(error);
}

function getContainerSizes(){
  return docker.listContainersQ({ size: true }).then(function(containers){
    return Q.all(containers.map(function(container){
      return Q.fcall(function(){
        return imageCache.get(container.Image) || getImageSize(container.Image);
      }).then(function(imageSize){
        containerCache.set(container.Id, parseInt(container.SizeRw, 10) + imageSize);
      });
    }));
  });
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

module.exports = {
  all: function(id){
    return Q.all([
      this.mem(id),
      this.cpu(id),
      this.hdd(id),
    ]).spread(function(mem, cpu, hdd){
      return {
        mem: mem.mem,
        cpu: cpu.cpu,
        hdd: hdd.hdd
      };
    });
  },
  mem: function(id){
    return exec('cat ' + MEM_DIR + id + '/memory.usage_in_bytes').catch(noFileCatch).then(parseInt).then(function(mem){
      return { mem: mem };
    });
  },
  cpu: function(id){
    return exec('cat ' + CPU_DIR + id + '/cpuacct.usage').catch(noFileCatch).then(parseInt).then(function(cpu){
      return { cpu: cpu };
    });
  },
  hdd: function(id){
    return Q.fcall(function(){
      if(Date.now() - lastSizeCheck > HDD_TTL){
        return getContainerSizes();
      }
    }).then(function(){
      return { hdd: containerCache.get(id) || 0 };
    });
  }
};