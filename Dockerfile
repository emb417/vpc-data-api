# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install only production dependencies to keep the final image small
COPY package*.json ./
RUN npm ci --omit=dev

# Copy all JavaScript files from the root directory.
# This ensures that the db.json file is not baked into the image.
COPY src/ ./

# Stage 2: Create the final, minimal image
FROM node:24-alpine

WORKDIR /app

# Only copy the essential production files from the builder stage.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/routers ./routers
COPY --from=builder /app/helpers ./helpers
COPY --from=builder /app/index.js ./

EXPOSE 6080

CMD ["node", "index.js"]