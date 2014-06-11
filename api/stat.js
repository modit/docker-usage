var Q       = require('q')
  , exec    = Q.denodeify(require('child_process').exec)
;

var MEM_DIR = process.env.MEM_DIR || '/sys/fs/cgroup/memory/docker/';
var CPU_DIR = process.env.CPU_DIR || '/sys/fs/cgroup/cpuacct/docker/';
var HDD_DIR = process.env.HDD_DIR || '/var/lib/docker/devicemapper/mnt/';

function noFileCatch(error){
  if(error.code === 1) {
    return 0;
  }
  return Q.reject(error);
}

module.exports = {
  all: function(id){
    return Q.all([
      this.mem(id),
      this.cpu(id),
      this.hdd(id),
    ]).spread(function(mem, cpu, hdd){
      return {
        mem: mem,
        cpu: cpu,
        hdd: hdd
      };
    });
  },
  mem: function(id){
    return exec('cat ' + MEM_DIR + id + '/memory.usage_in_bytes').catch(noFileCatch).then(parseInt);
  },
  cpu: function(id){
    return exec('cat ' + CPU_DIR + id + '/cpuacct.usage').catch(noFileCatch).then(parseInt);
  },
  hdd: function(id){
    return exec('du ' + HDD_DIR + id + '/rootfs -s').catch(noFileCatch).then(parseInt).then(function(output){
      return output * 1024;
    });
  }
};