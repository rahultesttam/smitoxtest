FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV NPM_CONFIG_UNSAFE_PERM=true
ENV CI=true

# Copy package files first
COPY package*.json .npmrc ./

# Install dependencies with legacy peer deps
RUN if [ -f package-lock.json ]; then \
      echo "Found package-lock.json — running npm ci"; \
      npm ci --unsafe-perm --legacy-peer-deps; \
    else \
      echo "No package-lock.json — running npm install"; \
      npm install --unsafe-perm --legacy-peer-deps; \
    fi

# Copy source and build
COPY . .
RUN npm run build

# Start command
CMD ["npm", "run", "start"]
COPY . .

# Build step (root package.json build now runs client build)
RUN npm run build

# Start command
CMD ["npm", "run", "start"]
