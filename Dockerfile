# In this project we are going for multi stage containerization as it is safe and clean

# Base stage uses a lite weight image of node
FROM node:20-alpine AS base

# Configuration to enable pnpm inside the container
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# this stage uses the base image and install dependencies on top of that
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# --frozen-lockfile is a specifically strict install flag which installs exactly what's in pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# this stage uses the deps and compiles the project 
FROM deps AS build
WORKDIR /app

# it's an optimization where we avoid TS warnings and first add the typescript and build configs
COPY tsconfig.json tsconfig.build.json tsup.config.ts ./
COPY src ./src
RUN pnpm build

# this stage runs parallel to 2nd stage and install only production dependencies
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# this stage adds a new fresh file system inside the container dedicated to the run process only
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# imports what the project needs to run, doesn't build or install anything
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000

# runs the appliaction, "--enable-source-maps" is to provide information when the app breaks or logs something
# it ensures that we get exact location of errors or logs instead of a vague dist/server.js line 1500 error
CMD ["node", "--enable-source-maps", "dist/server.js"]
