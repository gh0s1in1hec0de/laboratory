To run containers separately, you can use following commands:
```
docker run -d \
  --name starton-db \
  -e POSTGRES_DB=exmaple_db \
  -e POSTGRES_USER=exmaple_user \
  -e POSTGRES_PASSWORD=exmaple_password \
  -e POSTGRES_HOST=localhost \
  -v ../postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:latest
```