#bin/bash

docker-compose down
docker prune -f
docker-compose build
docker-compose up