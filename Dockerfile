# Utiliser Node.js 18 Alpine comme image de base
FROM node:18-alpine AS builder

# Installer les dépendances système nécessaires
RUN apk add --no-cache python3 make g++

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

# Installer dumb-init pour une gestion correcte des signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances depuis le stage builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Créer les répertoires nécessaires
RUN mkdir -p /app/uploads /app/storage /app/exports && \
    chown -R nestjs:nodejs /app

# Changer vers l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 3000

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Utiliser dumb-init pour démarrer l'application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"] 