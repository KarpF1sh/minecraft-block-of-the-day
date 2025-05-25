FROM node:18

ARG SERVER_PORT
# Set environment variables
ENV SERVER_PORT=${SERVER_PORT}

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

COPY ./public/static/* ./static/

# Expose the port the app runs on
EXPOSE ${SERVER_PORT}

# Build the application
RUN npm run build

# Command to run the application
CMD ["npm", "start"]