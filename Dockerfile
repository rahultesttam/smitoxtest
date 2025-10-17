FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

COPY package*.json .npmrc ./
RUN npm cache clean --force
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
