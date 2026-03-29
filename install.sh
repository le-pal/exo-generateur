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
  echo ">>> Mise à jour..."
  cd exo-generateur
  git pull
else
  echo ">>> Clonage du dépôt..."
  git clone https://github.com/le-pal/exo-generateur.git
  cd exo-generateur
fi

echo ">>> Build et démarrage..."
docker compose up -d --build

echo ""
echo "✓ Déployé sur https://exo.cynique.com"
