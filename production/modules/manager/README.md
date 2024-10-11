# Creating IPFS node, necessary for storing new launches metadata

```bash
docker run -d --name ipfs_daemon \
   -v /opt/ipfs_stuff/export:/export \
   -v /opt/ipfs_stuff/data:/data/ipfs \
   -p 4001:4001 \
   -p 4001:4001/udp \
   -p 0.0.0.0:8080:8080 \
   -p 0.0.0.0:5010:5010 \
   ipfs/kubo:latest
```