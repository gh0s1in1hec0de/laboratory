To run containers separately, you can use following commands:
```
docker run -d \
  --name starton-db \
  -e POSTGRES_DB=launchpad \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev_pass \
  -e POSTGRES_HOST=localhost \
  -v ./postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:latest
```