# WAY Esports Docker Compose Deployment

## Prerequisites

- Ensure Docker and Docker Compose are installed on your server.

## Setup and Run

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

2. Build and start the services:

```bash
docker compose up -d --build
```

3. To update the services after pulling new changes:

```bash
git pull origin main
docker compose up -d --build
```

## Notes

- The project uses multi-stage Dockerfiles for frontend and backend.
- Husky and prepare scripts are disabled in Docker builds to avoid errors.
- `.dockerignore` files exclude unnecessary files like `node_modules`, `dist`, `.git`, and logs.
- Frontend is served via Nginx on port 8080.
- Backend runs on port 3000.
- Healthchecks are configured for both services in `docker-compose.yml`.

This setup allows easy deployment and updates on any server with Docker Compose, without relying on GitHub Actions or manual workarounds.
