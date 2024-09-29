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
Now that the network is created, run the PostgreSQL container and connect it to the network. This will also mount a volume for persistent storage and expose the database on port 5432.

Run the following command in directory, where We want to locate postgres volume directory:
```bash
docker run -d \
--name st-database \
--network starlink \
-e POSTGRES_DB=example_db \
-e POSTGRES_USER=example_user \
-e POSTGRES_PASSWORD=example_password \
-v ./postgres-data:/var/lib/postgresql/data \
-p 5432:5432 \
postgres:16
```

### Step 4: Run any services
To run any service container correctly, we need to provide our custom network as an argument:
```bash
docker run -d \
        --name manager-service \
        --network starlink \
        -v $(pwd)/modules/logs[manager]:/app/modules/logs[manager] \
        -v $(pwd)/modules/manager/config.yaml:/app/modules/manager/config.yaml \
        manager:latest
```
We also create volumes for logging and dynamic config parsing here.

### Step 5: Verify Network Connectivity Between Containers
#### 1. Inspect the Network:

We can verify that both containers are connected to the `starlink` by inspecting the network:
```bash
docker network inspect starlink
```
This command will show us a list of containers attached to the network. We should see both `database` and `manager-service` listed.

#### 2. Test the Connection:

We can test the connection from the `manager-service` to the PostgreSQL container by running:

```bash
docker exec -it manager-service bash
psql -h database -U example_user -d example_db
```
If We’ve set an alias (e.g., db), We can connect using that as well:
```bash
docker network connect --alias db starlink database
```
Now, inside the `manager-service`, We can use the alias db to connect:
```bash
psql -h db -U example_user -d example_db
```

### Bonus 
To save time here is unified command for all the services - just set the name:
```bash
service="manager" docker run -d \
  --name ${service}-service \
  --network starlink \
  -v $(pwd)/modules/logs[${service}]:/app/modules/logs[${service}] \
  -v $(pwd)/modules/${service}/config.yaml:/app/modules/${service}/config.yaml \
  ${service}:latest
```
P.S. fishell version looks like this:
```bash
service="manager" docker run -d \
        --name {$service}-service \
        --network starlink \
        -v $(pwd)/modules/logs[{$service}]:/app/modules/logs[{$service}] \
        -v $(pwd)/modules/{$service}/config.yaml:/app/modules/{$service}/config.yaml \
        {$service}:latest
```