FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

# Install Node.js and npm first
RUN nix-env -iA nixpkgs.nodejs nixpkgs.nodePackages.npm

# Copy package files and clean npm cache
COPY package*.json .npmrc ./
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy the rest of the code and build
COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
