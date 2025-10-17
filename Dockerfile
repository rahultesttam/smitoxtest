FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

# Ensure npm will install with legacy peer deps and allow running lifecycle scripts as root
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV NPM_CONFIG_UNSAFE_PERM=true
ENV CI=true

# Copy package manifests first (leverages Docker layer cache)
COPY package*.json .npmrc ./

# If package-lock.json exists use npm ci, otherwise fall back to npm install.
RUN bash -lc '\
  if [ -f package-lock.json ]; then \
    echo "Found package-lock.json — running npm ci"; \
    npm ci --unsafe-perm --legacy-peer-deps; \
  else \
    echo "No package-lock.json — running npm install"; \
    npm install --unsafe-perm --legacy-peer-deps; \
  fi'

# Copy full source and build client assets
COPY . .

# Build step (root package.json build now runs client build)
RUN npm run build

# Start command
CMD ["npm", "run", "start"]
