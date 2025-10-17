FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

# Use nixpkgs to install a specific Node.js version
RUN nix-channel --add https://nixos.org/channels/nixpkgs-unstable nixpkgs
RUN nix-channel --update
RUN nix-env -iA nixpkgs.nodejs_18

# Copy package files and clean npm cache
COPY package*.json .npmrc ./
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy the rest of the code and build
COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
