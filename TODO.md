# TODO: Restructure WAY-Esports Project for Manual Deployment

## 1. Remove Husky and Related Scripts
- [ ] Remove husky from way-esports/package.json devDependencies
- [ ] Remove prepare, preinstall, postinstall, install, postprepare scripts from all package.json files
- [ ] Delete .husky/ directory if exists
- [ ] Delete .github/workflows/ directory if exists

## 2. Create .npmrc Files
- [ ] Create frontend/.npmrc with ignore-scripts=true, audit=false, fund=false
- [ ] Create backend/.npmrc with ignore-scripts=true, audit=false, fund=false

## 3. Create .dockerignore Files
- [ ] Create frontend/.dockerignore with node_modules, dist, .git, *.log, Dockerfile, docker-compose.yml
- [ ] Create backend/.dockerignore with node_modules, dist, .git, *.log, Dockerfile, docker-compose.yml

## 4. Update Dockerfiles
- [ ] Rewrite frontend/Dockerfile with node:20-alpine, multi-stage build, relative paths, no husky
- [ ] Rewrite backend/Dockerfile with node:20-alpine, multi-stage build, relative paths, no husky

## 5. Update docker-compose.yml
- [ ] Update build paths to ./frontend and ./backend
- [ ] Set ports to 3000 for backend, 8080 for frontend
- [ ] Add depends_on backend for frontend
- [ ] Remove unnecessary healthchecks if any

## 6. Create run.sh
- [ ] Create run.sh with docker compose build --pull && docker compose up -d
- [ ] Make it executable

## 7. Create .env.example
- [ ] Create .env.example with minimal env vars (PORT, MONGODB_URI, JWT_SECRET, TELEGRAM_TOKEN)

## 8. Update README.md
- [ ] Update README.md with manual deployment instructions

## 9. Verify Paths and Remove Absolute References
- [ ] Ensure no RUN npm install vite or absolute paths like way-esports/frontend/...
- [ ] All paths relative within frontend/ and backend/

## 10. Test Deployment
- [ ] Ensure ./run.sh works on clean server without husky errors
- [ ] Frontend accessible on http://<IP>:8080
- [ ] Backend accessible on http://<IP>:3000
