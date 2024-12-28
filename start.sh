#bin/bash
#Copy files to dist
cp ./src/*.html ./dist/
cp ./src/*.css ./dist/
#Bundle files
npx webpack --config webpack-back.config.js 
npx webpack --config webpack-front.config.js 
#Erase old containerz
docker-compose down
docker container prune -f
docker volume prune -f
docker image prune -f
#Build new containers
docker-compose build
docker-compose up