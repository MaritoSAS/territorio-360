# Imagen para OCI Compute / Container Instances.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS=
ENV NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS=$NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS
ENV NEXT_STANDALONE=1
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
# OCI_OBJECT_STORAGE_PAR_URL se inyecta en tiempo de ejecución (docker run -e ...), nunca en la imagen.
CMD ["node", "server.js"]
