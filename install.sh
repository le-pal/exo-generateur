#!/bin/sh
set -e

# ── Vérifications ──────────────────────────────────────────────────────────────

if ! command -v docker > /dev/null 2>&1; then
  echo "Erreur : Docker n'est pas installé."
  exit 1
fi

if ! docker compose version > /dev/null 2>&1; then
  echo "Erreur : Docker Compose n'est pas disponible."
  exit 1
fi

# ── Installation ou mise à jour ────────────────────────────────────────────────

if [ -d "exo-generateur" ]; then
  echo ">>> Mise à jour du code..."
  cd exo-generateur
  git pull
else
  echo ">>> Clonage du dépôt..."
  git clone https://github.com/le-pal/exo-generateur.git
  cd exo-generateur
fi

# ── Création des répertoires de données ───────────────────────────────────────

echo ">>> Création des volumes..."
mkdir -p ./volumes/app ./volumes/caddy
chmod 777 ./volumes/app ./volumes/caddy

# ── Génération du docker-compose.yml ──────────────────────────────────────────

echo ">>> Création du docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: exo-generateur
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DB_PATH: /data/exo.db
    volumes:
      - ./volumes/app:/data
    networks:
      - exo_net

  caddy:
    image: caddy:alpine
    container_name: exo-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./volumes/caddy:/data
    depends_on:
      - app
    networks:
      - exo_net

networks:
  exo_net:
    driver: bridge
EOF

# ── Build et démarrage ────────────────────────────────────────────────────────

echo ">>> Build et démarrage..."
docker compose up -d --build

echo ""
echo "✓ Déployé sur https://exo.scheffer.top"
