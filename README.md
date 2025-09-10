# WAY Esports Deployment Instructions

## Prerequisites

- Ensure Docker and Docker Compose are installed on your server.
- Create the secrets directory and environment file:

```bash
sudo mkdir -p /opt/way-esports/secrets
sudo nano /opt/way-esports/secrets/backend.env
# Paste your environment variables here
sudo chmod 600 /opt/way-esports/secrets/backend.env
```

## Clone the repository

```bash
sudo mkdir -p /opt/way-esports
cd /opt/way-esports
if [ ! -d way-esports ]; then
  git clone https://github.com/virall228/way-esports.git
fi
cd way-esports
```

## Build and run containers

```bash
docker compose -f docker-compose.prod.yml pull || true
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

## Cleaning old images

To remove old images with uppercase names:

```bash
docker rmi $(docker images | grep -E 'Virall228|WAY-Esports' | awk '{print $3}') 2>/dev/null || true
```

## Notes

- All paths and image names use lowercase for consistency.
- Backend and frontend images are separate: `ghcr.io/virall228/way-esports-backend` and `ghcr.io/virall228/way-esports-frontend`.
- Healthchecks are configured in `docker-compose.prod.yml` for service reliability.
- Use the GitHub Actions workflow `.github/workflows/deploy.yml` for automated builds and pushes to GHCR.
