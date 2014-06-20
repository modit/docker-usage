docker-usage
============

## Service to retrieve the usage for docker containers

### Usage

#### Run in Docker container
You will need to mount the appropriate crgoup directories

```
docker run -d -v /var/run/docker.sock:/docker.sock
              -v /sys/fs/cgroup/memory/docker/:/stat/mem/:ro
              -v /sys/fs/cgroup/cpuacct/docker/:/stat/cpu/:ro
              -e SOCKET_PATH=/docker.sock
              -e MEM_DIR=/stat/mem/
              -e CPU_DIR=/stat/cpu/
              -e LOG_PATH=/logs
              -p 4244:80 modit/docker-usage
```

#### Get Usage
```GET /api/v1/:container```
###### Example Response
```
{
  "hdd": {
    "image": 312229904,
    "container": 12092
  },
  "mem": 67461120,
  "cpu": 1363002157
}
```

#### Puny Web Requests? Try Web sockets instead!
##### Using socket.io-client

```javascript
var socket = io.connect(host + ':' + port);
socket.on('connect', function(){
  console.log('Monitoring Usage', host);
});
  
socket.on('usage', function(data){
  console.log(data);
});
```
##### Example data
```json
{
  "id": "842a3812be31769b0fba8f281f5b24bbeb060197158df83572cd5eeffba520a8",
  "usage": {
    "hdd": {
      "image": 312229904,
      "container": 12092
    },
    "mem": 67461120,
    "cpu": 1363002157
  }
}
```
