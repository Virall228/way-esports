# Deployment Instructions

## Initial Build and Run

To build and start the project for the first time on your server, run:

```bash
docker compose build --no-cache --pull
docker compose up -d
```

## Updating the Project

To update the project with the latest changes, run:

```bash
git pull origin main
docker compose up -d --build
```

## Notes

- The project uses multi-stage Docker builds for both frontend and backend.
- The frontend Dockerfile uses `npm ci` with retry settings to avoid DNS resolution errors.
- The backend Dockerfile installs dependencies separately and uses `npm ci --omit=dev` for production.
- Docker Compose includes healthchecks and restart policies for reliability.
- Make sure Docker and Docker Compose are installed on your server.
- The backend service listens on port 3000 (mapped to 4000 externally).
- The frontend service listens on port 80.

For any issues, check container logs with:

```bash
docker compose logs -f
```
