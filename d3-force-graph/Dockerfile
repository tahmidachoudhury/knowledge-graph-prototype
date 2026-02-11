# base image
FROM node:22-alpine

# set working directory
WORKDIR /app

# copy dependencies
COPY package*.json ./

# install dependencies
RUN npm install

# copy all files to app/ directory
COPY . .

# build the app
RUN npm run build

# document port
EXPOSE 5173

# start the app
CMD [ "npm", "run", "dev" ]
