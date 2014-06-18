docker-usage
============

## Service to retrieve the usage for a given container

### Usage

#### Run in Docker container
You will need to mount the appropriate crgoup directories

```docker run -d -v /var/run/docker.sock:/docker.sock
                 -v /sys/fs/cgroup/memory/docker/:/stat/mem/:ro
                 -v /sys/fs/cgroup/cpuacct/docker/:/stat/cpu/:ro
                 -e SOCKET_PATH=/docker.sock
                 -e MEM_DIR=/stat/mem/
                 -e CPU_DIR=/stat/cpu/
                 -e LOG_PATH=/logs
                 -p 4244:80 modit/docker-usage```

#### Get All Usage
```GET /api/v1/:container```
###### Example Response
```{"mem":27824128,"cpu":19190563636,"hdd":810549248}```

#### Get Memory Usage
```GET /api/v1/:container/mem```
###### Example Response
```{"mem":27824128}```

#### Get Cpu Usage
```GET /api/v1/:container/cpu```
###### Example Response
```{"cpu":19190563636}```

#### Get HDD Usage
```GET /api/v1/:container/hdd```
###### Example Response
```{"hdd":810549248}```
