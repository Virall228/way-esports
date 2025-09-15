# WAY Esports Docker Compose Deployment

## Prerequisites

- Ensure Docker and Docker Compose are installed on your server.

## Setup and Run

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

2. Build and start the services (first time or after major changes):

```bash
docker compose build --no-cache --pull
docker compose up -d
```

3. To update the services after pulling new changes:

```bash
git pull origin main
docker compose up -d --build
```

## Troubleshooting

If you encounter husky or npm script errors during build:

```bash
# Clean Docker cache and rebuild
docker builder prune -af
docker compose build --no-cache --pull
docker compose up -d
```

## Notes

- The project uses multi-stage Dockerfiles for frontend and backend.
- Husky and prepare scripts are disabled in Docker builds to avoid errors.
- `.dockerignore` files exclude unnecessary files like `node_modules`, `dist`, `.git`, and logs.
- Frontend is served via Nginx on port 8080.
- Backend runs on port 3000.
- Healthchecks are configured for both services in `docker-compose.yml`.

This setup allows easy deployment and updates on any server with Docker Compose, without relying on GitHub Actions or manual workarounds.
