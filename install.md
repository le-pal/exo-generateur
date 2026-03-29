# Installation

## Prérequis

- Docker + Docker Compose installés sur le serveur
- Port 80 et 443 ouverts et redirigés vers le serveur
- Enregistrement DNS : `exo.cynique.com → <IP publique du serveur>`

## Déploiement initial

```bash
git clone https://github.com/le-pal/exo-generateur.git
cd exo-generateur
docker compose up -d --build
```

L'application est accessible sur **https://exo.cynique.com**
Le certificat HTTPS est obtenu automatiquement via Let's Encrypt.

## Mise à jour

```bash
cd exo-generateur
git pull
docker compose up -d --build
```

## Commandes utiles

```bash
# Voir les logs en direct
docker compose logs -f

# Voir l'état des conteneurs
docker compose ps

# Redémarrer sans rebuild
docker compose restart

# Arrêter
docker compose down
```

## Configuration

Les clés API et le modèle par défaut se configurent depuis l'interface d'administration : **https://exo.cynique.com/admin**
