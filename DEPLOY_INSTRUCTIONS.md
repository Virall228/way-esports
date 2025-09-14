# WAY-Esports Deployment Instructions

## Prerequisites on Server

1. Install Docker and Docker Compose:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable --now docker
   ```

2. Add your user to the docker group (optional, for running docker without sudo):
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. Create a `.env.prod` file in the deployment directory with all required environment variables for backend, frontend, and bot.

## Docker Compose Production Setup

- Use the provided `docker-compose.prod.yml` file to run the services:
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```

- This will start backend, frontend, bot (if available), MongoDB, Redis, and Watchtower.

- Ports exposed:
  - Frontend: 80
  - Backend: 4000
  - Bot: no external ports

- Watchtower automatically checks for new image versions every 60 seconds and updates containers with `--cleanup`.

## GitHub Secrets Setup

- Create a GitHub Personal Access Token (PAT) with `write:packages` and `read:packages` scopes.
- Add the following secrets in your repository settings under **Settings > Secrets > Actions**:
  - `GHCR_USERNAME`: your GitHub username
  - `GHCR_TOKEN`: your PAT token

## GitHub Actions Workflow

- The workflow `.github/workflows/deploy.yml` triggers on push to `main`.
- It builds and pushes Docker images for backend, frontend, and bot to GitHub Container Registry (GHCR).
- Images are tagged with `latest` and the commit SHA.

## Deployment and Rollback

- To deploy the latest images:
  ```bash
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up -d
  ```

- To rollback to a previous image tag (replace `<tag>` with commit SHA or tag):
  ```bash
  docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend=ghcr.io/virall228/way-esports-backend:<tag> frontend=ghcr.io/virall228/way-esports-frontend:<tag> bot=ghcr.io/virall228/way-esports-bot:<tag>
  ```

## Updating Environment Variables

- Update `.env.prod` file on the server.
- Restart services:
  ```bash
  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml up -d
  ```

## Notes

- Watchtower handles automatic container updates when new images are pushed.
- Ensure `.env.prod` contains all necessary environment variables for all services.
- For any manual intervention, use `docker-compose` commands as above.

This setup provides a fully automated, reliable deployment pipeline with zero manual SSH steps for builds and updates.
