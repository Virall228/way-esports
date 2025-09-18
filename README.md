# WAY-Esports Manual Deployment

This project is configured for manual deployment using Docker and Docker Compose.

## Deployment Instructions

1. Clone the repository:
   ```
   git clone <REPO_URL>
   cd <REPO_NAME>
   ```

2. Copy the example environment variables file:
   ```
   cp .env.example .env
   ```

3. Make the run script executable:
   ```
   chmod +x run.sh
   ```

4. Run the deployment script:
   ```
   ./run.sh
   ```

## Access

- Frontend will be available at: `http://<IP>:8080`
- Backend will be available at: `http://<IP>:3000`

## Notes

- This setup removes automatic deployment and husky hooks.
- All builds are done inside Docker containers with scripts ignored to avoid husky install errors.
