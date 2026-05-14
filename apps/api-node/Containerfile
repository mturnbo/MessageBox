# Use the official Node.js version 14 image as the base
FROM node:22

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install the project dependencies inside the container
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose port 3000 so the app can be accessed from outside the container
EXPOSE 3000

# Define the command to run the application
CMD ["node", "src/app.js", "--experimental-modules", "--es-module-specifier-resolution=node"]
