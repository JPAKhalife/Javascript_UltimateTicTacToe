#bin/bash

docker-compose down
docker container prune -f
docker-compose build
docker-compose up