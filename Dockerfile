FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

RUN mkdir -p "${STATIC_DIR}" && cp -r ./public/static/* "${STATIC_DIR}/"

# Expose the port the app runs on
EXPOSE 3000

# Build the application
RUN npm run build

# Command to run the application
CMD ["npm", "start"]