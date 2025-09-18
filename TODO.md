# Docker Build Issue Resolution TODO

## Completed
- [x] Analyzed the user task and identified the issue with Docker using old Dockerfile or directories
- [x] Searched for relevant Docker-related files
- [x] Read docker-compose.yml, docker-compose.prod.yml, backend/Dockerfile, and way-esports-front/frontend/Dockerfile
- [x] Confirmed build contexts in docker-compose files are correct
- [x] Created docker_cleanup_and_build.sh script to automate the resolution steps
- [x] Made the script executable
- [x] Created TODO.md to track progress
- [x] Verified that old directories (way-esports/, way-esports-backend/, frontend/) do not exist in the repository
- [x] Confirmed News model is already in backend/models/News.ts with correct import in routes
- [x] Updated backend/tsconfig.json to remove baseUrl for correct path resolution

## Pending
- [ ] Run the script on the server to update repo, clean old files, and rebuild Docker images
- [ ] Verify that the build uses the new Dockerfile and directories
- [ ] Test the application to ensure it works correctly with the updated setup

## Steps to Run on Server
1. Copy docker_cleanup_and_build.sh to the server
2. Run `./docker_cleanup_and_build.sh` in the project directory
3. Check logs and verify containers are running correctly
