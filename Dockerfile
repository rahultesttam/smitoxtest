FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

# Copy package files
COPY package*.json .npmrc ./

# Install dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copy the rest of the code and build
COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
RUN npm run build

CMD ["npm", "run", "start"]
