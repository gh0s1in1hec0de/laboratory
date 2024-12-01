include .env
export

POSTGRES_DB ?= default_db
POSTGRES_USER ?= default_user
POSTGRES_PASSWORD ?= default_password
DOCKER_NETWORK = starlink
PWD=$(shell pwd)
POSTGRES_DATA_DIR := $(shell realpath ../postgres-data)

show-envs:
	echo POSTGRES_DB=$(POSTGRES_DB)
	echo POSTGRES_USER=$(POSTGRES_USER)
	echo POSTGRES_PASSWORD=$(POSTGRES_PASSWORD)

# Build commands
build-postgres:
	docker build -t postgres-cron:latest --build-arg POSTGRES_DB=starton -f postgres.Dockerfile .

build-manager:
	docker build -t manager -f manager.Dockerfile .

build-frontend:
	docker build -t frontend -f frontend.Dockerfile .

build-dispenser:
	docker build -t dispenser -f dispenser.Dockerfile .

build-oracle:
	docker build -t oracle -f oracle.Dockerfile .

# Don't rename this container!
run-database:
	docker run -d \
		--name db \
		--network $(DOCKER_NETWORK) \
		-e POSTGRES_DB=$(POSTGRES_DB) \
		-e POSTGRES_USER=$(POSTGRES_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-v $(POSTGRES_DATA_DIR)/postgres-data:/var/lib/postgresql/data \
		-p 5432:5432 \
		postgres-cron:latest

run-dispenser:
	docker run -d \
		--name st-dispenser \
		--network $(DOCKER_NETWORK) \
		-v $(PWD)/modules/logs_dispenser:/app/modules/logs_dispenser \
		-v $(PWD)/modules/dispenser/config.yaml:/app/modules/dipsenser/config.yaml \
		-p 5003:5003 \
		dispenser:latest

run-oracle:
	docker run -d \
		--name st-oracle \
		--network $(DOCKER_NETWORK) \
		-v $(PWD)/modules/logs_oracle:/app/modules/logs_oracle \
		-v $(PWD)/modules/oracle/config.yaml:/app/modules/oracle/config.yaml \
		-p 5002:5002 \
		oracle:latest

run-frontend:
	docker run -d \
		--name st-frontend \
		--network $(DOCKER_NETWORK) \
		-p 3000:3000 \
		frontend:latest

run-manager:
	docker run -d \
		--name st-manager \
		--network $(DOCKER_NETWORK) \
		--restart on-failure \
		-v $(PWD)/modules/logs_manager:/app/modules/logs_manager \
		-v $(PWD)/modules/manager/config.yaml:/app/modules/manager/config.yaml \
		-p 5001:5001 \
		manager:latest

run-ipfs:
	docker run -d \
		--name ipfs_node \
		-v /opt/ipfs/export:/export \
		-v /opt/ipfs/data:/data/ipfs \
		-p 4001:4001 \
		-p 4001:4001/udp \
		-p 8080:8080 \
		-p 5010:5001 \
		ipfs/kubo:latest

# Combined build commands
build-all: build-postgres build-manager build-frontend build-dispenser build-oracle

# Combined run commands
run-all: run-database run-dispenser run-oracle run-frontend run-manager

# Stop and clean up all containers
stop-all:
	docker stop st-database st-dispenser st-oracle st-frontend st-manager || true
	docker rm st-database st-dispenser st-oracle st-frontend st-manager || true
