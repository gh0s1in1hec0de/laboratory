# Docker Setup with Custom Network
This is a manual of creating dockerized setup with independent Docker containers,
that see each other and work in a correct manner.

### Step 1: Build the Docker Images
Before running the containers, we need to build the Docker images.
```bash
docker build -t manager -f manager.Dockerfile .
````
```bash
docker build -t oracle -f oracle.Dockerfile .
````
etc.

### Step 2: Create a Custom Docker Network
To allow containers to communicate with each other by name, create a custom Docker network. This is necessary for enabling container-to-container communication (such as between a database and an application).

Run the following command to create the network:
```bash
docker network create starlink
```
This creates a network named `starlink` that will allow containers connected to it to communicate using their names as hostnames.

### Step 3: Run the PostgreSQL Container

##### 1. Build the Docker Image
First, ensure you are in the root directory of your project, where your postgres.Dockerfile is located. Run the following command to build the PostgreSQL image that includes the pg_cron extension:

```bash
docker build -t postgres-cron:latest --build-arg POSTGRES_DB=example_db_name -f postgres.Dockerfile .
```

##### 2. Run the PostgreSQL Container

After the image has been built, run the following command to start the container:
```bash
docker run -d \
--name db \
--network starlink \
-e POSTGRES_DB=example_db \
-e POSTGRES_USER=example_user \
-e POSTGRES_PASSWORD=example_password \
-v ./postgres-data:/var/lib/postgresql/data \
-p 5432:5432 \
postgres-cron:latest
```

### Step 4: Run any services
To run any service container correctly, we need to provide our custom network as an argument:
```bash
service="manager/oracle/etc" docker run -d \
  --name st-${service} \
  --network starlink \
  --restart on-failure \
  -v $(pwd)/modules/logs_${service}:/app/modules/logs_${service} \
  -v $(pwd)/modules/${service}/config.yaml:/app/modules/${service}/config.yaml \
  ${service}:latest
```
We also create volumes for logging and dynamic config parsing here.

### Step 5: Verify Network Connectivity Between Containers
#### 1. Inspect the Network:

We can verify that both containers are connected to the `starlink` by inspecting the network:
```bash
docker network inspect starlink
```
This command will show us a list of containers attached to the network. We should see both `database` and `st-manager` listed.

#### 2. Test the Connection:

We can test the connection from the `st-manager` to the PostgreSQL container by running:

```bash
docker exec -it st-manager bash
psql -h database -U example_user -d example_db_name
```
If We’ve set an alias (e.g., db), We can connect using that as well:
```bash
docker network connect --alias db starlink database
```
Now, inside the `st-manager`, We can use the alias db to connect:
```bash
psql -h db -U example_user -d example_db_name
```

### P.S. 

Fishell version looks like this:
```bash
service="manager/oracle/etc" docker run -d \
        --name {$service}-service \
        --network starlink \
        --restart on-failure \
        -v $(pwd)/modules/logs_{$service}:/app/modules/logs_{$service} \
        -v $(pwd)/modules/{$service}/config.yaml:/app/modules/{$service}/config.yaml \
        {$service}:latest
```

```bash
docker run -d \
  --name st-frontend \
  --network starlink \
  --restart on-failure \
  -p 3000:3000 \
  -v $(pwd)/modules/frontend/.env:/app/modules/frontend/.env \
  frontend:latest
```