#bin/bash

docker-compose down
docker container prune -f
docker volume prune -f
docker image prune -f
docker-compose build
docker-compose up