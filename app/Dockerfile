# Node version
FROM node:10.6.0-alpine

# Create a work directory
# -p with parent directories if necessary
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json /usr/src/app

RUN yarn

# Port
EXPOSE 8000

# Bundle app source
VOLUME [ "/usr/src/app" ]
