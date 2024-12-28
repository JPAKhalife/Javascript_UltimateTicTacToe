#bin/bash
#Copy files to dist
cp ./src/*.html ./out
cp ./src/*.css ./out
#Bundle files
npx webpack
#Erase old containerz
docker-compose down
docker container prune -f
docker volume prune -f
docker image prune -f
#Build new containers
docker-compose build
docker-compose up