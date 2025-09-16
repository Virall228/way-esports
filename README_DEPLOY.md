# WAY Esports Deployment

## Manual Deployment Instructions

This project uses Docker Compose for deployment. The deployment is manual and consists of building and running containers with a single command.

### Prerequisites

- Docker and Docker Compose installed on the server.
- Clone the repository to the server.

### Setup

1. Clone the repository:

```bash
git clone <REPO_URL>
cd <REPO_NAME>
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Make the run script executable:

```bash
chmod +x run.sh
```

4. Run the deployment script:

```bash
./run.sh
```

### Access

- Frontend: http://<SERVER_IP>:8080
- Backend: http://<SERVER_IP>:3000

---

### Project Structure Notes

- The project is a monorepo with `frontend` and `backend` directories.
- Dockerfiles and `.npmrc` files are configured to disable husky and install scripts during Docker builds.
- The deployment uses multi-stage Docker builds for production readiness.
